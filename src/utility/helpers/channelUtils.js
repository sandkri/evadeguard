import { client } from '../../bot.js';

/**
 * Gets a channel object from a guild by ID
 * @param {String} guildId The ID of the guild
 * @param {String} channelId The ID of the channel to get
 * @param {Object} options Additional options
 * @param {Boolean} [options.ignoreNotFound=false] Whether to return null instead of throwing when channel isn't found
 * @param {Array} [options.requiredTypes] Array of channel types to validate against
 * @returns {Promise<Channel|null>} The found channel or null
 * @throws {Error} If channel doesn't exist and ignoreNotFound is false
 */
export async function getChannel(guildId, channelId, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!channelId) throw new Error('Channel ID must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId).catch(error => {
    if (error.code === 10004) { // Unknown Guild
      if (options.ignoreNotFound) return null;
      throw new Error(`Guild with ID ${guildId} not found`);
    }
    throw error;
  });

  if (!guild) return null;

  // Get the channel
  const channel = await guild.channels.fetch(channelId).catch(error => {
    if (error.code === 10003) { // Unknown Channel
      if (options.ignoreNotFound) return null;
      throw new Error(`Channel with ID ${channelId} not found in guild ${guild.name}`);
    }
    throw error;
  });

  if (!channel) return null;

  // Validate channel type if required
  if (options.requiredTypes && options.requiredTypes.length > 0) {
    if (!options.requiredTypes.includes(channel.type)) {
      throw new Error(`Channel ${channel.name} is not of required type. Expected: ${options.requiredTypes.join(', ')}`);
    }
  }

  return channel;
}

/**
 * Gets a channel by name search
 * @param {String} guildId The ID of the guild
 * @param {String} nameQuery The name or partial name to search for 
 * @param {Object} options Additional options
 * @param {String} [options.type] Filter by channel type
 * @param {Boolean} [options.exactMatch=false] Whether to require exact name match
 * @returns {Promise<Channel|null>} The found channel or null
 */
export async function findChannelByName(guildId, nameQuery, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!nameQuery) throw new Error('Channel name query must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId).catch(() => null);
  if (!guild) return null;

  // Get all channels
  await guild.channels.fetch();

  // Find channel by name
  const foundChannel = guild.channels.cache.find(channel => {
    // Filter by type if specified
    if (options.type && channel.type !== options.type) {
      return false;
    }

    if (options.exactMatch) {
      return channel.name === nameQuery;
    } else {
      return channel.name.toLowerCase().includes(nameQuery.toLowerCase());
    }
  });

  return foundChannel || null;
}

/**
 * Checks if a channel exists in a guild
 * @param {String} guildId The ID of the guild
 * @param {String} channelId The ID of the channel to check
 * @returns {Promise<Boolean>} Whether the channel exists
 */
export async function channelExists(guildId, channelId) {
  try {
    const channel = await getChannel(guildId, channelId, { ignoreNotFound: true });
    return !!channel;
  } catch (error) {
    return false;
  }
}

/**
 * Gets a text-based channel that can be sent messages to
 * @param {String} guildId The ID of the guild
 * @param {String} channelId The ID of the channel
 * @returns {Promise<TextBasedChannel|null>} The text-based channel or null
 */
export async function getTextChannel(guildId, channelId) {
  const channel = await getChannel(guildId, channelId, { 
    ignoreNotFound: true,
    // Channel types that support sending messages (text, news, threads, etc.)
    requiredTypes: [0, 1, 2, 3, 4, 5, 10, 11, 12, 15]
  });
  
  if (channel && 'send' in channel) {
    return channel;
  }
  
  return null;
}