import { client } from '../../bot.js';
import { ChannelType, PermissionFlagsBits } from 'discord.js';

/**
 * Gets a category channel by ID
 * @param {String} guildId The ID of the guild
 * @param {String} categoryId The ID of the category to get
 * @param {Object} options Additional options
 * @param {Boolean} [options.ignoreNotFound=false] Whether to return null instead of throwing when category isn't found
 * @returns {Promise<CategoryChannel|null>} The found category channel or null
 */
export async function getCategory(guildId, categoryId, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!categoryId) throw new Error('Category ID must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId).catch(error => {
    if (error.code === 10004) { // Unknown Guild
      if (options.ignoreNotFound) return null;
      throw new Error(`Guild with ID ${guildId} not found`);
    }
    throw error;
  });

  if (!guild) return null;

  // Get the category
  const category = await guild.channels.fetch(categoryId).catch(error => {
    if (error.code === 10003) { // Unknown Channel
      if (options.ignoreNotFound) return null;
      throw new Error(`Category with ID ${categoryId} not found in guild ${guild.name}`);
    }
    throw error;
  });

  if (!category) return null;

  // Validate that it's a category
  if (category.type !== ChannelType.GuildCategory) {
    if (options.ignoreNotFound) return null;
    throw new Error(`Channel ${category.name} is not a category`);
  }

  return category;
}

/**
 * Find a category by name
 * @param {String} guildId The ID of the guild
 * @param {String} categoryName The name or partial name of the category
 * @param {Object} options Additional options
 * @param {Boolean} [options.exactMatch=false] Whether to require exact name match
 * @returns {Promise<CategoryChannel|null>} The found category or null
 */
export async function findCategoryByName(guildId, categoryName, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!categoryName) throw new Error('Category name must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return null;

  // Get all channels
  await guild.channels.fetch();

  // Find category by name
  const foundCategory = guild.channels.cache.find(channel => {
    // Must be a category
    if (channel.type !== ChannelType.GuildCategory) {
      return false;
    }

    if (options.exactMatch) {
      return channel.name.toLowerCase() === categoryName.toLowerCase();
    } else {
      return channel.name.toLowerCase().includes(categoryName.toLowerCase());
    }
  });

  return foundCategory || null;
}

/**
 * Create a new category in a guild
 * @param {String} guildId The ID of the guild
 * @param {String} categoryName The name of the category
 * @param {Object} options Additional options
 * @param {Number} [options.position] Position of the category
 * @param {Object} [options.permissionOverwrites] Permission overwrites for the category
 * @returns {Promise<CategoryChannel>} The created category
 */
export async function createCategory(guildId, categoryName, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!categoryName) throw new Error('Category name must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId);

  // Create the category
  return guild.channels.create({
    name: categoryName,
    type: ChannelType.GuildCategory,
    position: options.position,
    permissionOverwrites: options.permissionOverwrites || []
  });
}

/**
 * Get all channels in a category
 * @param {String} guildId The ID of the guild
 * @param {String} categoryId The ID of the category
 * @param {Object} options Additional options
 * @param {String} [options.type] Filter channels by type
 * @returns {Promise<Array<GuildChannel>>} Array of channels in the category
 */
export async function getChannelsInCategory(guildId, categoryId, options = {}) {
  const category = await getCategory(guildId, categoryId, { ignoreNotFound: true });
  if (!category) return [];

  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Fetch all channels to ensure we have the latest data
  await guild.channels.fetch();

  // Find all channels with this category as parent
  return guild.channels.cache
    .filter(channel => {
      const matchesParent = channel.parentId === categoryId;
      const matchesType = !options.type || channel.type === options.type;
      return matchesParent && matchesType;
    })
    .toJSON();
}

/**
 * Move a channel to a category
 * @param {String} guildId The ID of the guild
 * @param {String} channelId The ID of the channel to move
 * @param {String} categoryId The ID of the category to move to
 * @returns {Promise<GuildChannel>} The updated channel
 */
export async function moveChannelToCategory(guildId, channelId, categoryId) {
  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Get the channel
  const channel = await guild.channels.fetch(channelId);
  if (!channel) throw new Error(`Channel with ID ${channelId} not found`);

  // Get the category
  const category = await getCategory(guildId, categoryId);
  
  // Move the channel
  return channel.setParent(categoryId);
}

/**
 * Create a private category that only specific roles or members can see
 * @param {String} guildId The ID of the guild
 * @param {String} categoryName The name of the category
 * @param {Object} options Additional options
 * @param {String[]} [options.allowRoleIds=[]] Role IDs that can see the category
 * @param {String[]} [options.allowUserIds=[]] User IDs that can see the category
 * @returns {Promise<CategoryChannel>} The created category
 */
export async function createPrivateCategory(guildId, categoryName, options = {}) {
  const guild = await client.guilds.fetch(guildId);
  
  // Default permission overwrites - deny @everyone
  const permissionOverwrites = [
    {
      id: guild.id, // @everyone role
      deny: [PermissionFlagsBits.ViewChannel]
    }
  ];
  
  // Add role permissions
  if (options.allowRoleIds && options.allowRoleIds.length) {
    for (const roleId of options.allowRoleIds) {
      permissionOverwrites.push({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel]
      });
    }
  }
  
  // Add user permissions
  if (options.allowUserIds && options.allowUserIds.length) {
    for (const userId of options.allowUserIds) {
      permissionOverwrites.push({
        id: userId,
        allow: [PermissionFlagsBits.ViewChannel]
      });
    }
  }
  
  // Create the category
  return createCategory(guildId, categoryName, {
    position: options.position,
    permissionOverwrites
  });
}

/**
 * Check if a category exists
 * @param {String} guildId The ID of the guild
 * @param {String} categoryId The ID of the category
 * @returns {Promise<Boolean>} Whether the category exists
 */
export async function categoryExists(guildId, categoryId) {
  try {
    const category = await getCategory(guildId, categoryId, { ignoreNotFound: true });
    return !!category;
  } catch (error) {
    return false;
  }
}