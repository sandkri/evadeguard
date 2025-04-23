import { 
    PermissionsBitField, 
    ChannelSelectMenuBuilder, 
    ComponentType, 
    ActionRowBuilder,
    ButtonBuilder
  } from 'discord.js';
  import { getServerConfig, updateSetting } from '../../utility/serverSettings.js';
  import { CommandBuilder } from '../../utility/commandBuilder.js';
  import { paginator, EmbedBuilder, ButtonStyle, Colors } from '../../utility/interaction/paginator.js';
  
  export default {
    data: new CommandBuilder()
      .setName('server')
      .setDescription('Manage server configuration')
      .addSubcommand(command => 
        command
          .setName('info')
          .setDescription('View current server configuration')
      )
      .addSubcommand(command =>
        command
          .setName('setup')
          .setDescription('Interactive server setup wizard')
      )
      .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
  
    async execute(interaction) {
      const guildId = interaction.guild.id;
      const subcommand = interaction.options.getSubcommand();
  
      if (subcommand === 'info') {
        try {
          // Get server configuration
          const config = await getServerConfig(guildId);
          
          // Extract channel IDs from config
          const appealChannelId = config?.set?.appeal?.channel;
          
          // Format channel mentions
          const appealChannel = appealChannelId ? `<#${appealChannelId}>` : 'Not set';
          
          // Create embed with server configuration
          const embed = new EmbedBuilder()
            .setTitle(`📊 Server Configuration: ${interaction.guild.name}`)
            .setColor(Colors.Blue)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .addFields(
              { name: '🔍 Server ID', value: guildId, inline: true },
              { name: '👥 Member Count', value: `${interaction.guild.memberCount}`, inline: true },
              { name: '\u200B', value: '\u200B', inline: true },
              { name: '📧 Appeal Channel', value: appealChannel, inline: true }
            )
            .setFooter({ text: 'EvadeGuard • Server Configuration', iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();
          
          // Additional stats about guild (optional)
          if (interaction.guild.premiumSubscriptionCount !== null) {
            embed.addFields({ 
              name: '✨ Boost Level', 
              value: `Level ${interaction.guild.premiumTier} (${interaction.guild.premiumSubscriptionCount} boosts)`,
              inline: false 
            });
          }
          
          // How to modify settings
          embed.addFields({ 
            name: '⚙️ How to Configure', 
            value: 'Use the `/set` command to modify these settings:\n' +
                   '• `/set appeal #channel` - Set appeal channel\n' +
                   'Or use `/server setup` for an interactive setup wizard',
            inline: false
          });
          
          return interaction.reply({ embeds: [embed] });
        } catch (error) {
          console.error(`Error fetching server info: ${error.message}`);
          return interaction.reply({ 
            content: '❌ There was an error retrieving server configuration.', 
            ephemeral: true
          });
        }
      } 
      
      else if (subcommand === 'setup') {
        const config = await getServerConfig(guildId);
        
        // Initialize the paginator with this interaction
        paginator.init(interaction)
          .setOptions({
            timeout: 300000, // 5 minutes
            startPage: 'main'
          });
        
        // Create the main menu page
        paginator.page('main', {
          title: "👋 EvadeGuard Setup",
          description: "Welcome to the EvadeGuard Setup Wizard!\n\nSelect an option below to configure your server.",
          color: Colors.Blue,
          thumbnail: interaction.guild.iconURL({ dynamic: true }),
          fields: [
            { 
              name: "Current Configuration", 
              value: `**Appeal Channel**: ${config?.set?.appeal?.channel ? `<#${config.set.appeal.channel}>` : "Not set"}`,
              inline: false
            }
          ],
          options: [
            {
              label: "Appeal Channel",
              description: "Where users can submit punishment appeals",
              value: "appeal_page",
              emoji: "📧"
            }
          ],
          footer: { 
            text: "EvadeGuard • Setup Wizard", 
            iconURL: interaction.client.user.displayAvatarURL() 
          }
        });
        
        // Create the appeal channel setup page
        paginator.page('appeal_page', {
          title: "📧 Appeal Channel Setup",
          description: "Select the channel where user appeals should be sent.\n\nThis channel will receive notifications when users appeal their punishments. It should be a private channel that only moderators can access.",
          color: Colors.Blue,
          backTo: "main",
          components: [
            new ActionRowBuilder().addComponents(
              new ChannelSelectMenuBuilder()
                .setCustomId('appeal_channel_select')
                .setPlaceholder('Select a channel')
                .setChannelTypes([0]) // Text channels only
            )
          ]
        });
        
        // Add a handler for the channel select
        paginator.addHandler('appeal_page', 'appeal_channel_select', async (i, collector, pages) => {
          const selectedChannel = i.values[0];
          
          // Create a saving embed
          const savingEmbed = new EmbedBuilder()
            .setTitle("💾 Saving Configuration")
            .setDescription("Updating your server settings...")
            .setColor(Colors.Blue);
          
          await i.update({
            embeds: [savingEmbed],
            components: []
          });
          
          // Save the setting
          await updateSetting(guildId, "set.appeal.channel", selectedChannel);
          
          // Update the main page with the new channel
          const mainPage = pages.get("main");
          mainPage.fields[0].value = `**Appeal Channel**: <#${selectedChannel}>`;
          
          // Show success message
          const successEmbed = new EmbedBuilder()
            .setTitle("✅ Appeal Channel Configured")
            .setDescription(`Successfully set the appeal channel to <#${selectedChannel}>.`)
            .setColor(Colors.Green);
          
          // Add buttons for navigation
          const components = [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('goto_main')
                .setLabel('Back to Main Menu')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('close_menu')
                .setLabel('Exit Setup')
                .setStyle(ButtonStyle.Secondary)
            )
          ];
          
          await i.editReply({
            embeds: [successEmbed],
            components: components
          });
        });
        
        // Render the menu
        await paginator.render();
        
        return;
      }
  
      return interaction.reply({ 
        content: '❌ This subcommand is not implemented yet.',
        ephemeral: true 
      });
    },
  };