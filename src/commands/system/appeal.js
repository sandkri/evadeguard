import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  Colors
} from 'discord.js';
import { reaxionEmbed } from '../../utility/helpers/embed.js';
import { users } from '../../utility/database/data.js';

export default {
  data: new SlashCommandBuilder()
    .setName('appeal')
    .setDescription('Appeal a punishment or manage appeals')
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Submit a punishment appeal')
    )
    .addSubcommand(sub =>
      sub.setName('accept')
        .setDescription('Accept an appeal')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to accept appeal for')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('deny')
        .setDescription('Deny an appeal')
        .addUserOption(opt =>
          opt.setName('user')
            .setDescription('User to deny appeal for')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // /appeal create supports DM
    if (sub === 'create') {
      const modal = new ModalBuilder()
        .setCustomId('appealModal')
        .setTitle('Punishment Appeal');

      const reasonInput = new TextInputBuilder()
        .setCustomId('appeal_reason')
        .setLabel('Why should we remove your punishment?')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const serverInput = new TextInputBuilder()
        .setCustomId('appeal_server')
        .setLabel('Server ID you are appealing to')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(reasonInput),
        new ActionRowBuilder().addComponents(serverInput)
      );

      return await interaction.showModal(modal);
    }

    // Guild-only commands
    if (!interaction.guildId) {
      return await interaction.reply({
        content: "❌ This command must be run in a server.",
        ephemeral: true
      });
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return await interaction.reply({
        content: "❌ You do not have permission to use this command.",
        ephemeral: true
      });
    }

    const guildId = interaction.guildId;
    const target = interaction.options.getUser('user');
    
    // First check if the user has any punishment in THIS server
    const targetModel = users([guildId, target.id]);
    const userData = await targetModel.get();
    
    if (!userData?.punishment?.time) {
      return await interaction.reply({
        content: `❌ ${target.tag} doesn't have any active punishment in this server.`,
        ephemeral: true
      });
    }

    if (sub === 'accept') {
      await targetModel.update({ punishment: { evading: false, time: 0 } });

      const embed = reaxionEmbed()
        .setTitle("✅ Appeal Accepted")
        .setDescription(`${target.tag}'s punishment has been lifted.`)
        .setColor(Colors.Green);

      await interaction.reply({ embeds: [embed] });

      try {
        await target.send(`✅ Your appeal in **${interaction.guild.name}** was **accepted**. Your punishment has been removed.`);
      } catch {
        console.warn(`Could not DM ${target.tag}`);
      }
    }

    if (sub === 'deny') {
      const embed = reaxionEmbed()
        .setTitle("❌ Appeal Denied")
        .setDescription(`${target.tag}'s appeal has been denied.`)
        .setColor(Colors.Red);

      await interaction.reply({ embeds: [embed] });

      try {
        await target.send(`❌ Your appeal in **${interaction.guild.name}** was **denied**. You must wait until your punishment ends.`);
      } catch {
        console.warn(`Could not DM ${target.tag}`);
      }
    }
  }
};