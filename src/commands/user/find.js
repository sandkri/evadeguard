import { 
    Colors,
    PermissionsBitField,
    StringSelectMenuBuilder,
    ActionRowBuilder
  } from 'discord.js';
  import { CommandBuilder } from '../../utility/commandBuilder.js';
  import { paginator, EmbedBuilder } from '../../utility/interaction/paginator.js';
  import { 
    getRole, 
    findRoleByName, 
    getAllRoles,
    getMembersWithRole
  } from '../../utility/helpers/roleUtils.js';
  
  export default {
    data: new CommandBuilder()
      .setName('find')
      .setDescription('Find users in the server')
      .addSubcommand(subcommand =>
        subcommand
          .setName('role')
          .setDescription('Find users with a specific role')
          .addRoleOption(option =>
            option
              .setName('role')
              .setDescription('The role to search for')
              .setRequired(false)
          )
          .addStringOption(option =>
            option
              .setName('rolename')
              .setDescription('Search for a role by name')
              .setRequired(false)
          )
      ),
  
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      
      if (subcommand === 'role') {
        await handleRoleSearch(interaction);
      } else {
        await interaction.reply({
          content: '❌ Invalid subcommand.',
          ephemeral: true
        });
      }
    }
  };
  
  /**
   * Handle the role search functionality
   * @param {CommandInteraction} interaction 
   */
  async function handleRoleSearch(interaction) {
    await interaction.deferReply();
    const guildId = interaction.guildId;
    
    // Get role from options if provided
    let role = interaction.options.getRole('role');
    const roleName = interaction.options.getString('rolename');
    
    // If no role was directly selected but a name was provided, search for it
    if (!role && roleName) {
      role = await findRoleByName(guildId, roleName, { exactMatch: false });
      
      if (!role) {
        return interaction.editReply({
          content: `❌ Couldn't find any role matching "${roleName}".`,
          ephemeral: true
        });
      }
    }
    
    // If no role was provided at all, show role selection menu
    if (!role) {
      return showRoleSelectionMenu(interaction);
    }
    
    // Get members with the role
    const loadingEmbed = new EmbedBuilder()
      .setTitle('⏳ Searching...')
      .setDescription(`Finding members with the role ${role.name}`)
      .setColor(Colors.Blue);
      
    await interaction.editReply({ embeds: [loadingEmbed] });
    
    try {
      const members = await getMembersWithRole(guildId, role.id);
      
      if (members.length === 0) {
        const noMembersEmbed = new EmbedBuilder()
          .setTitle('🔍 Search Results')
          .setDescription(`No members found with the role **${role.name}**.`)
          .setColor(Colors.Red);
          
        return interaction.editReply({ embeds: [noMembersEmbed] });
      }
      
      // Display results with pagination if needed
      await displayMemberResults(interaction, role, members);
      
    } catch (error) {
      console.error('Error searching for members with role:', error);
      await interaction.editReply({
        content: '❌ An error occurred while searching for members with this role.',
        ephemeral: true
      });
    }
  }
  
  /**
   * Show a menu to select roles
   * @param {CommandInteraction} interaction 
   */
  async function showRoleSelectionMenu(interaction) {
    const guildId = interaction.guildId;
    
    try {
      // Get all roles
      const roles = await getAllRoles(guildId, { excludeEveryone: true, excludeManaged: true });
      
      // Sort by position (highest first)
      roles.sort((a, b) => b.position - a.position);
      
      // Initialize paginator for role selection
      paginator.init(interaction)
        .setOptions({
          timeout: 180000, // 3 minutes
          ephemeral: false
        });
      
      // Create role selection page
      paginator.page('role_select', {
        title: '🔍 Find Users by Role',
        description: 'Select a role to see which members have it.',
        color: Colors.Blue,
        fields: [
          { 
            name: 'Available Roles', 
            value: 'Choose from the dropdown menu below to see users with a specific role.'
          }
        ],
        components: createRoleSelectionComponents(roles)
      });
      
      // Add handler for role selection
      paginator.addHandler('role_select', 'role_select_menu', async (i, collector) => {
        const selectedRoleId = i.values[0];
        const selectedRole = roles.find(r => r.id === selectedRoleId);
        
        if (!selectedRole) {
          await i.update({
            content: '❌ Selected role not found.',
            components: []
          });
          collector.stop();
          return;
        }
        
        // Show loading state
        const loadingEmbed = new EmbedBuilder()
          .setTitle('⏳ Searching...')
          .setDescription(`Finding members with the role ${selectedRole.name}`)
          .setColor(Colors.Blue);
          
        await i.update({ embeds: [loadingEmbed], components: [] });
        
        try {
          // Get members with the selected role
          const members = await getMembersWithRole(interaction.guildId, selectedRoleId);
          
          if (members.length === 0) {
            const noMembersEmbed = new EmbedBuilder()
              .setTitle('🔍 Search Results')
              .setDescription(`No members found with the role **${selectedRole.name}**.`)
              .setColor(Colors.Red);
              
            await i.editReply({ embeds: [noMembersEmbed] });
            collector.stop();
            return;
          }
          
          // Display results with pagination if needed
          await displayMemberResults(i, selectedRole, members, collector);
          
        } catch (error) {
          console.error('Error searching for members with role:', error);
          await i.editReply({
            content: '❌ An error occurred while searching for members with this role.',
            embeds: []
          });
          collector.stop();
        }
      });
      
      // Render the paginator
      await paginator.render();
      
    } catch (error) {
      console.error('Error showing role selection menu:', error);
      await interaction.editReply({
        content: '❌ An error occurred while loading roles.',
        ephemeral: true
      });
    }
  }
  
  /**
   * Create role selection components
   * @param {Array<Role>} roles 
   * @returns {Array<ActionRowBuilder>}
   */
  function createRoleSelectionComponents(roles) {
    // Limit to 25 roles (Discord limit for select menu)
    const selectableRoles = roles.slice(0, 25);
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('role_select_menu')
      .setPlaceholder('Select a role')
      .addOptions(selectableRoles.map(role => ({
        label: role.name,
        value: role.id,
        description: `${role.members.size} members`,
        default: false
      })));
    
    return [new ActionRowBuilder().addComponents(selectMenu)];
  }
  
  /**
   * Display member results with pagination
   * @param {CommandInteraction|MessageComponentInteraction} interaction 
   * @param {Role} role 
   * @param {Array<GuildMember>} members 
   * @param {InteractionCollector} [existingCollector] Optional existing collector
   */
  async function displayMemberResults(interaction, role, members, existingCollector) {
    // Stop existing collector if provided
    if (existingCollector) {
      existingCollector.stop();
    }
    
    const totalMembers = members.length;
    const membersPerPage = 10;
    const totalPages = Math.ceil(totalMembers / membersPerPage);
    
    // If there's only a few members, display them without pagination
    if (totalMembers <= membersPerPage) {
      const resultsEmbed = createMembersEmbed(role, members, 1, 1);
      await interaction.editReply({ embeds: [resultsEmbed], components: [] });
      return;
    }
    
    // Use paginator for multiple pages
    paginator.init(interaction)
      .setOptions({
        timeout: 300000, // 5 minutes
        ephemeral: false
      });
    
    // Create a page for each set of results
    for (let page = 1; page <= totalPages; page++) {
      const startIdx = (page - 1) * membersPerPage;
      const endIdx = Math.min(startIdx + membersPerPage, totalMembers);
      const pageMembers = members.slice(startIdx, endIdx);
      
      const pageId = `members_page_${page}`;
      const buttons = [];
      
      // Add navigation buttons for pages > 1
      if (totalPages > 1) {
        if (page > 1) {
          buttons.push({
            id: `goto_members_page_${page - 1}`,
            label: 'Previous',
            style: 'Secondary',
            emoji: '◀️'
          });
        }
        
        if (page < totalPages) {
          buttons.push({
            id: `goto_members_page_${page + 1}`,
            label: 'Next',
            style: 'Secondary',
            emoji: '▶️'
          });
        }
      }
      
      // Create the page
      paginator.page(pageId, {
        embed: createMembersEmbed(role, pageMembers, page, totalPages),
        buttons: buttons,
        showCloseButton: true
      });
    }
    
    // Set the start page and render
    paginator.setOptions({ startPage: 'members_page_1' });
    await paginator.render();
  }
  
  /**
   * Create an embed displaying members with a role
   * @param {Role} role 
   * @param {Array<GuildMember>} members 
   * @param {Number} currentPage 
   * @param {Number} totalPages 
   * @returns {EmbedBuilder}
   */
  function createMembersEmbed(role, members, currentPage, totalPages) {
    const embed = new EmbedBuilder()
      .setTitle(`🔍 Members with role: ${role.name}`)
      .setColor(role.color || Colors.Blue)
      .setFooter({ 
        text: `Page ${currentPage}/${totalPages} • ${members.length} members displayed`
      });
      
    // Format the members list
    const membersList = members.map((member, index) => {
      const startIdx = (currentPage - 1) * 10;
      return `**${startIdx + index + 1}.** ${member.user.tag} (${member})`;
    }).join('\n');
    
    embed.setDescription(membersList || 'No members found.');
    
    return embed;
  }