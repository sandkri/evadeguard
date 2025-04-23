import { servers } from "./database/data.js";

/**
 * Get a server's configuration
 * @param {string} guildId - The ID of the guild
 * @returns {Promise<Object>} The server configuration
 */
export async function getServerConfig(guildId) {
  const serverModel = servers([guildId]);
  return await serverModel.get() || { set: {} };
}

/**
 * Get a specific server setting
 * @param {string} guildId - The ID of the guild
 * @param {string} path - Dot notation path to setting (e.g., "set.welcome.channel")
 * @returns {Promise<any>} The setting value
 */
export async function getSetting(guildId, path) {
  const config = await getServerConfig(guildId);
  const parts = path.split('.');
  
  let value = config;
  for (const part of parts) {
    if (value === undefined || value === null) return null;
    value = value[part];
  }
  
  return value;
}

/**
 * Update a server's settings
 * @param {string} guildId - The ID of the guild
 * @param {string} path - Dot notation path to setting (e.g., "set.welcome.channel")
 * @param {any} value - The new value
 */
export async function updateSetting(guildId, path, value) {
  const serverModel = servers([guildId]);
  const currentData = await serverModel.get() || { set: {} };
  
  // Build the nested object structure
  const parts = path.split('.');
  let target = currentData;
  
  // Navigate to the parent object that will hold our value
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!target[part]) target[part] = {};
    target = target[part];
  }
  
  // Set the value
  target[parts[parts.length - 1]] = value;
  
  // Save the updated data
  await serverModel.set(currentData);
  return true;
}