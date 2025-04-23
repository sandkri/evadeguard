import { client } from '../../bot.js';
import { ChannelType, ThreadAutoArchiveDuration } from 'discord.js';

/**
 * Gets a thread by ID
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread to get
 * @param {Object} options Additional options
 * @param {Boolean} [options.ignoreNotFound=false] Whether to return null instead of throwing when thread isn't found
 * @returns {Promise<ThreadChannel|null>} The found thread or null
 */
export async function getThread(guildId, threadId, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!threadId) throw new Error('Thread ID must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId).catch(error => {
    if (error.code === 10004) { // Unknown Guild
      if (options.ignoreNotFound) return null;
      throw new Error(`Guild with ID ${guildId} not found`);
    }
    throw error;
  });

  if (!guild) return null;

  // Get the thread
  const thread = await guild.channels.fetch(threadId).catch(error => {
    if (error.code === 10003) { // Unknown Channel
      if (options.ignoreNotFound) return null;
      throw new Error(`Thread with ID ${threadId} not found in guild ${guild.name}`);
    }
    throw error;
  });

  if (!thread) return null;

  // Validate that it's a thread
  const threadTypes = [
    ChannelType.PublicThread,
    ChannelType.PrivateThread,
    ChannelType.AnnouncementThread
  ];
  
  if (!threadTypes.includes(thread.type)) {
    if (options.ignoreNotFound) return null;
    throw new Error(`Channel ${thread.name} is not a thread`);
  }

  return thread;
}

/**
 * Create a new thread in a text channel
 * @param {String} guildId The ID of the guild
 * @param {String} channelId The ID of the parent channel
 * @param {Object} options Thread creation options
 * @param {String} options.name The name of the thread
 * @param {String} [options.message] The message to start the thread from (if provided)
 * @param {Boolean} [options.private=false] Whether the thread should be private
 * @param {Number} [options.autoArchiveDuration=1440] Auto-archive duration in minutes (60, 1440, 4320, 10080)
 * @param {String} [options.reason] Reason for creating the thread (for audit logs)
 * @returns {Promise<ThreadChannel>} The created thread
 */
export async function createThread(guildId, channelId, options) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!channelId) throw new Error('Channel ID must be provided');
  if (!options.name) throw new Error('Thread name must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId);

  // Get the parent channel
  const channel = await guild.channels.fetch(channelId);
  if (!channel) throw new Error(`Channel with ID ${channelId} not found`);

  // Check if channel supports threads
  if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type)) {
    throw new Error(`Channel ${channel.name} does not support threads`);
  }
  
  // Determine auto-archive duration
  const validDurations = [60, 1440, 4320, 10080];
  const autoArchiveDuration = options.autoArchiveDuration && validDurations.includes(options.autoArchiveDuration)
    ? options.autoArchiveDuration
    : 1440; // Default to 24 hours
  
  // Create thread from message or create new thread
  if (options.message) {
    // If message ID is provided, create thread from message
    const message = await channel.messages.fetch(options.message);
    return message.startThread({
      name: options.name,
      autoArchiveDuration: autoArchiveDuration,
      reason: options.reason
    });
  } else {
    // Create new thread
    return channel.threads.create({
      name: options.name,
      autoArchiveDuration: autoArchiveDuration,
      type: options.private ? ChannelType.PrivateThread : ChannelType.PublicThread,
      reason: options.reason
    });
  }
}

/**
 * Send a message to a thread
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread
 * @param {String|Object} content The message content or message options
 * @returns {Promise<Message>} The sent message
 */
export async function sendThreadMessage(guildId, threadId, content) {
  const thread = await getThread(guildId, threadId);
  
  // If content is a string, convert to object format
  const messageOptions = typeof content === 'string' 
    ? { content } 
    : content;
  
  return thread.send(messageOptions);
}

/**
 * Archive or unarchive a thread
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread
 * @param {Boolean} [archive=true] Whether to archive (true) or unarchive (false) the thread
 * @param {String} [reason] Reason for the action (for audit logs)
 * @returns {Promise<ThreadChannel>} The updated thread
 */
export async function setThreadArchived(guildId, threadId, archive = true, reason) {
  const thread = await getThread(guildId, threadId);
  return thread.setArchived(archive, reason);
}

/**
 * Lock or unlock a thread
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread
 * @param {Boolean} [locked=true] Whether to lock (true) or unlock (false) the thread
 * @param {String} [reason] Reason for the action (for audit logs)
 * @returns {Promise<ThreadChannel>} The updated thread
 */
export async function setThreadLocked(guildId, threadId, locked = true, reason) {
  const thread = await getThread(guildId, threadId);
  return thread.setLocked(locked, reason);
}

/**
 * Add a user to a thread
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread
 * @param {String} userId The ID of the user to add
 * @returns {Promise<ThreadChannel>} The updated thread
 */
export async function addThreadMember(guildId, threadId, userId) {
  const thread = await getThread(guildId, threadId);
  return thread.members.add(userId);
}

/**
 * Remove a user from a thread
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread
 * @param {String} userId The ID of the user to remove
 * @returns {Promise<ThreadChannel>} The updated thread
 */
export async function removeThreadMember(guildId, threadId, userId) {
  const thread = await getThread(guildId, threadId);
  return thread.members.remove(userId);
}

/**
 * Check if a user is a member of a thread
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread
 * @param {String} userId The ID of the user to check
 * @returns {Promise<Boolean>} Whether the user is a member of the thread
 */
export async function isThreadMember(guildId, threadId, userId) {
  const thread = await getThread(guildId, threadId);
  try {
    const member = await thread.members.fetch(userId);
    return !!member;
  } catch (error) {
    return false;
  }
}

/**
 * Get all members of a thread
 * @param {String} guildId The ID of the guild
 * @param {String} threadId The ID of the thread
 * @returns {Promise<Collection<Snowflake, ThreadMember>>} Collection of thread members
 */
export async function getThreadMembers(guildId, threadId) {
  const thread = await getThread(guildId, threadId);
  return thread.members.fetch();
}

/**
 * List all active threads in a guild
 * @param {String} guildId The ID of the guild
 * @returns {Promise<Collection<string, ThreadChannel>>} Collection of active threads
 */
export async function listActiveThreads(guildId) {
  const guild = await client.guilds.fetch(guildId);
  const threads = await guild.channels.fetchActiveThreads();
  return threads.threads;
}

/**
 * Create a forum post thread (for forum channels)
 * @param {String} guildId The ID of the guild
 * @param {String} forumId The ID of the forum channel
 * @param {Object} options Forum post options
 * @param {String} options.name Thread name/title
 * @param {String|Object} options.message Initial message content or options
 * @param {String[]} [options.tags=[]] Array of tag IDs to apply
 * @param {Number} [options.autoArchiveDuration=1440] Auto-archive duration
 * @returns {Promise<ThreadChannel>} The created forum post thread
 */
export async function createForumPost(guildId, forumId, options) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!forumId) throw new Error('Forum channel ID must be provided');
  if (!options.name) throw new Error('Forum post name must be provided');
  if (!options.message) throw new Error('Initial message must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId);

  // Get the forum channel
  const forumChannel = await guild.channels.fetch(forumId);
  if (!forumChannel) throw new Error(`Channel with ID ${forumId} not found`);

  // Check if channel is a forum
  if (forumChannel.type !== ChannelType.GuildForum) {
    throw new Error(`Channel ${forumChannel.name} is not a forum channel`);
  }

  // Prepare message content
  const messageContent = typeof options.message === 'string'
    ? { content: options.message }
    : options.message;

  // Create the forum post
  return forumChannel.threads.create({
    name: options.name,
    message: messageContent,
    appliedTags: options.tags || [],
    autoArchiveDuration: options.autoArchiveDuration || ThreadAutoArchiveDuration.OneDay
  });
}