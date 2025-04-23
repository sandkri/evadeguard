import { client } from '../../bot.js';
import { PermissionsBitField, Colors } from 'discord.js';

/**
 * Gets a role by ID
 * @param {String} guildId The ID of the guild
 * @param {String} roleId The ID of the role to get
 * @param {Object} options Additional options
 * @param {Boolean} [options.ignoreNotFound=false] Whether to return null instead of throwing when role isn't found
 * @returns {Promise<Role|null>} The found role or null
 */
export async function getRole(guildId, roleId, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!roleId) throw new Error('Role ID must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId).catch(error => {
    if (error.code === 10004) { // Unknown Guild
      if (options.ignoreNotFound) return null;
      throw new Error(`Guild with ID ${guildId} not found`);
    }
    throw error;
  });

  if (!guild) return null;

  // Get the role
  const role = await guild.roles.fetch(roleId).catch(error => {
    if (error.code === 10011) { // Unknown Role
      if (options.ignoreNotFound) return null;
      throw new Error(`Role with ID ${roleId} not found in guild ${guild.name}`);
    }
    throw error;
  });

  if (!role) {
    if (options.ignoreNotFound) return null;
    throw new Error(`Role with ID ${roleId} not found in guild ${guild.name}`);
  }

  return role;
}

/**
 * Find a role by name
 * @param {String} guildId The ID of the guild
 * @param {String} roleName The name or partial name of the role
 * @param {Object} options Additional options
 * @param {Boolean} [options.exactMatch=false] Whether to require exact name match
 * @param {Boolean} [options.caseSensitive=false] Whether the match should be case sensitive
 * @returns {Promise<Role|null>} The found role or null
 */
export async function findRoleByName(guildId, roleName, options = {}) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!roleName) throw new Error('Role name must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId);

  // Fetch all roles
  await guild.roles.fetch();

  // Format search terms based on case sensitivity
  const searchName = options.caseSensitive ? roleName : roleName.toLowerCase();

  // Find role by name
  const foundRole = guild.roles.cache.find(role => {
    const roleCmpName = options.caseSensitive ? role.name : role.name.toLowerCase();
    
    if (options.exactMatch) {
      return roleCmpName === searchName;
    } else {
      return roleCmpName.includes(searchName);
    }
  });

  return foundRole || null;
}

/**
 * Create a new role in a guild
 * @param {String} guildId The ID of the guild
 * @param {Object} roleData The role data
 * @param {String} roleData.name The name of the role
 * @param {ColorResolvable} [roleData.color] The color of the role
 * @param {Boolean} [roleData.hoist=false] Whether the role should be displayed separately
 * @param {Boolean} [roleData.mentionable=false] Whether the role should be mentionable
 * @param {PermissionResolvable} [roleData.permissions] The permissions for the role
 * @param {String} [roleData.reason] Reason for creating the role (audit log)
 * @returns {Promise<Role>} The created role
 */
export async function createRole(guildId, roleData) {
  if (!guildId) throw new Error('Guild ID must be provided');
  if (!roleData.name) throw new Error('Role name must be provided');

  // Get the guild
  const guild = await client.guilds.fetch(guildId);

  // Create the role
  return guild.roles.create({
    name: roleData.name,
    color: roleData.color || null,
    hoist: roleData.hoist || false,
    mentionable: roleData.mentionable || false,
    permissions: roleData.permissions || [],
    reason: roleData.reason || 'Role created via roleUtils'
  });
}

/**
 * Delete a role from a guild
 * @param {String} guildId The ID of the guild
 * @param {String} roleId The ID of the role to delete
 * @param {String} [reason] Reason for deleting the role (audit log)
 * @returns {Promise<Role>} The deleted role
 */
export async function deleteRole(guildId, roleId, reason) {
  const role = await getRole(guildId, roleId);
  return role.delete(reason || 'Role deleted via roleUtils');
}

/**
 * Modify an existing role
 * @param {String} guildId The ID of the guild
 * @param {String} roleId The ID of the role to modify
 * @param {Object} roleData The role data to update
 * @param {String} [roleData.name] New name for the role
 * @param {ColorResolvable} [roleData.color] New color for the role
 * @param {Boolean} [roleData.hoist] Whether the role should be displayed separately
 * @param {Boolean} [roleData.mentionable] Whether the role should be mentionable
 * @param {PermissionResolvable} [roleData.permissions] New permissions for the role
 * @param {String} [roleData.reason] Reason for modifying the role (audit log)
 * @returns {Promise<Role>} The modified role
 */
export async function modifyRole(guildId, roleId, roleData) {
  const role = await getRole(guildId, roleId);
  
  // Prepare edit data
  const editData = {};
  
  if (roleData.name !== undefined) editData.name = roleData.name;
  if (roleData.color !== undefined) editData.color = roleData.color;
  if (roleData.hoist !== undefined) editData.hoist = roleData.hoist;
  if (roleData.mentionable !== undefined) editData.mentionable = roleData.mentionable;
  if (roleData.permissions !== undefined) editData.permissions = roleData.permissions;
  
  return role.edit(editData, roleData.reason || 'Role modified via roleUtils');
}

/**
 * Check if a role exists
 * @param {String} guildId The ID of the guild
 * @param {String} roleId The ID of the role to check
 * @returns {Promise<Boolean>} Whether the role exists
 */
export async function roleExists(guildId, roleId) {
  try {
    const role = await getRole(guildId, roleId, { ignoreNotFound: true });
    return !!role;
  } catch (error) {
    return false;
  }
}

/**
 * Get all roles in a guild
 * @param {String} guildId The ID of the guild
 * @param {Object} options Additional options
 * @param {Boolean} [options.excludeEveryone=true] Whether to exclude the @everyone role
 * @param {Boolean} [options.excludeManaged=false] Whether to exclude managed roles (bots, integrations)
 * @param {Function} [options.filter] Custom filter function (role) => boolean
 * @returns {Promise<Array<Role>>} Array of roles
 */
export async function getAllRoles(guildId, options = {}) {
  const guild = await client.guilds.fetch(guildId);
  
  // Fetch all roles
  await guild.roles.fetch();
  
  // Get roles from cache
  let roles = [...guild.roles.cache.values()];
  
  // Apply filters
  if (options.excludeEveryone !== false) {
    roles = roles.filter(role => role.id !== guild.id);
  }
  
  if (options.excludeManaged) {
    roles = roles.filter(role => !role.managed);
  }
  
  if (typeof options.filter === 'function') {
    roles = roles.filter(options.filter);
  }
  
  return roles;
}

/**
 * Add a role to a guild member
 * @param {String} guildId The ID of the guild
 * @param {String} userId The ID of the user
 * @param {String} roleId The ID of the role to add
 * @param {String} [reason] Reason for adding the role (audit log)
 * @returns {Promise<GuildMember>} The updated guild member
 */
export async function addRoleToMember(guildId, userId, roleId, reason) {
  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Get the member
  const member = await guild.members.fetch(userId);
  if (!member) throw new Error(`Member with ID ${userId} not found in guild ${guild.name}`);
  
  // Get the role
  const role = await getRole(guildId, roleId);
  
  // Add the role
  return member.roles.add(role, reason || 'Role added via roleUtils');
}

/**
 * Remove a role from a guild member
 * @param {String} guildId The ID of the guild
 * @param {String} userId The ID of the user
 * @param {String} roleId The ID of the role to remove
 * @param {String} [reason] Reason for removing the role (audit log)
 * @returns {Promise<GuildMember>} The updated guild member
 */
export async function removeRoleFromMember(guildId, userId, roleId, reason) {
  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Get the member
  const member = await guild.members.fetch(userId);
  if (!member) throw new Error(`Member with ID ${userId} not found in guild ${guild.name}`);
  
  // Get the role
  const role = await getRole(guildId, roleId);
  
  // Remove the role
  return member.roles.remove(role, reason || 'Role removed via roleUtils');
}

/**
 * Check if a member has a role
 * @param {String} guildId The ID of the guild
 * @param {String} userId The ID of the user
 * @param {String} roleId The ID of the role
 * @returns {Promise<Boolean>} Whether the member has the role
 */
export async function memberHasRole(guildId, userId, roleId) {
  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Get the member
  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return false;
  
  return member.roles.cache.has(roleId);
}

/**
 * Get all members who have a specific role
 * @param {String} guildId The ID of the guild
 * @param {String} roleId The ID of the role
 * @returns {Promise<Array<GuildMember>>} Array of guild members with the role
 */
export async function getMembersWithRole(guildId, roleId) {
  const role = await getRole(guildId, roleId);
  
  // Fetch all guild members (warning: can be slow for large guilds)
  const guild = await client.guilds.fetch(guildId);
  await guild.members.fetch();
  
  // Filter members who have the role
  return guild.members.cache
    .filter(member => member.roles.cache.has(roleId))
    .toJSON();
}

/**
 * Create a color role for a member (e.g. for name color)
 * @param {String} guildId The ID of the guild
 * @param {String} userId The ID of the user
 * @param {ColorResolvable} color The color to set
 * @param {Object} options Additional options
 * @param {Boolean} [options.removeOtherColorRoles=true] Whether to remove other color roles
 * @param {String} [options.rolePrefix='color-'] Prefix for color role names
 * @returns {Promise<Role>} The created/updated color role
 */
export async function setMemberColorRole(guildId, userId, color, options = {}) {
  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Get the member
  const member = await guild.members.fetch(userId);
  if (!member) throw new Error(`Member with ID ${userId} not found in guild ${guild.name}`);
  
  // Default options
  const rolePrefix = options.rolePrefix || 'color-';
  const removeOtherColorRoles = options.removeOtherColorRoles !== false;
  
  // Check for existing color role for this user
  const colorRoleName = `${rolePrefix}${userId}`;
  const existingRole = await findRoleByName(guildId, colorRoleName, { exactMatch: true });
  
  // If we should remove other color roles
  if (removeOtherColorRoles) {
    const colorRoles = member.roles.cache.filter(role => 
      role.name.startsWith(rolePrefix) && (!existingRole || role.id !== existingRole.id)
    );
    
    if (colorRoles.size > 0) {
      await member.roles.remove(colorRoles, 'Removing old color roles');
    }
  }
  
  // Update or create role
  if (existingRole) {
    await existingRole.edit({ color: color }, 'Updating color role');
    
    // Make sure member has this role
    if (!member.roles.cache.has(existingRole.id)) {
      await member.roles.add(existingRole, 'Adding color role');
    }
    
    return existingRole;
  } else {
    // Create new role and position it above the highest non-admin role
    const newRole = await createRole(guildId, {
      name: colorRoleName,
      color: color,
      reason: 'Creating color role for member'
    });
    
    // Add role to member
    await member.roles.add(newRole, 'Adding new color role');
    
    return newRole;
  }
}

/**
 * Get highest role position for a member
 * @param {String} guildId The ID of the guild
 * @param {String} userId The ID of the user
 * @returns {Promise<Number>} The position of the highest role the member has
 */
export async function getHighestRolePosition(guildId, userId) {
  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Get the member
  const member = await guild.members.fetch(userId);
  
  return member.roles.highest.position;
}

/**
 * Check if one member can moderate another based on role hierarchy
 * @param {String} guildId The ID of the guild
 * @param {String} moderatorId The ID of the potential moderator
 * @param {String} targetId The ID of the potential target
 * @returns {Promise<Boolean>} Whether the moderator can moderate the target
 */
export async function canModerate(guildId, moderatorId, targetId) {
  // Get the guild
  const guild = await client.guilds.fetch(guildId);
  
  // Get the members
  const moderator = await guild.members.fetch(moderatorId);
  const target = await guild.members.fetch(targetId);
  
  // Can't moderate yourself or the server owner
  if (moderatorId === targetId || targetId === guild.ownerId) {
    return false;
  }
  
  // Server owner can moderate anyone
  if (moderatorId === guild.ownerId) {
    return true;
  }
  
  // Check role hierarchy (higher position can moderate lower)
  return moderator.roles.highest.position > target.roles.highest.position;
}