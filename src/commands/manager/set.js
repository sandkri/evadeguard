import { PermissionsBitField } from 'discord.js';
import { updateSetting, getServerConfig } from '../../utility/serverSettings.js';
import { CommandBuilder } from '../../utility/commandBuilder.js';

export default {
  data: new CommandBuilder()
    .setName('set')
    .setDescription('Configure server settings')
    .addSubcommand(command => 
      command
        .setName('appeal')
        .setDescription('Set the appeal channel')
        .addChannelOption(option => option.setName('channel').setDescription('The channel to set as the appeal channel').setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'appeal') {
      try {
        const channel = interaction.options.getChannel('channel');
        
        // Changed: Use updateSetting instead of modifying JSON
        await updateSetting(guildId, "set.appeal.channel", channel.id);
        return interaction.reply(`✅ Appeal channel set to ${channel}`);
      } catch (error) {
        console.error(`Error setting appeal channel: ${error.message}`);
        return interaction.reply({ content: '❌ There was an error while executing this command.', ephemeral: true });
      }
    }

    return interaction.reply('❌ This subcommand is not implemented yet.');
  },
};