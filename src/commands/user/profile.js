import {
    Colors,
    PermissionsBitField
  } from 'discord.js';
  import { CommandBuilder } from '../../utility/commandBuilder.js';
  import { paginator, EmbedBuilder } from '../../utility/interaction/paginator.js';
  
  export default {
    data: new CommandBuilder()
      .setName('profile')
      .setDescription('View your user profile'),
  
    /**
     * Execute the profile command
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
      const user = interaction.user;
      const member = interaction.member;
  
      // Init paginator
      paginator.init(interaction).setOptions({
        startPage: 'main',
        timeout: 300000,
        ephemeral: true
      });
  
      // Page: Main Info
      paginator.page('main', {
        title: `👤 ${user.username}'s Profile`,
        description: "Here's your general profile information.",
        color: Colors.Blurple,
        thumbnail: user.displayAvatarURL({ dynamic: true }),
        fields: [
          { name: '🆔 User ID', value: user.id, inline: true },
          { name: '📛 Username', value: user.tag, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: '📆 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
          { name: '🗓️ Account Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true }
        ],
        options: [
          { label: 'Roles', value: 'roles', description: 'View all your roles', emoji: '🎭' },
          { label: 'Permissions', value: 'perms', description: 'See what permissions you have', emoji: '🛡️' }
        ],
        footer: {
          text: 'EvadeGuard • Profile Overview',
          iconURL: interaction.client.user.displayAvatarURL()
        }
      });
  
      // Page: Roles
      const roles = member.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .map(r => `<@&${r.id}>`)
        .join(', ') || 'No roles';
  
      paginator.page('roles', {
        title: '🎭 Your Roles',
        description: "These are the roles currently assigned to you.",
        color: Colors.Blue,
        backTo: 'main',
        fields: [
          { name: 'Roles', value: roles }
        ]
      });
  
      // Page: Permissions
      const perms = member.permissions.toArray().map(p => `• \`${p}\``).join('\n') || 'No permissions';
  
      paginator.page('perms', {
        title: '🛡️ Your Permissions',
        description: "These are your server permissions.",
        color: Colors.Gold,
        backTo: 'main',
        fields: [
          { name: 'Permissions', value: perms }
        ]
      });
  
      // Render menu
      await paginator.render();
    }
  };
  