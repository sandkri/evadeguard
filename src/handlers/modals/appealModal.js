import {
  Colors,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from "discord.js";
import { reaxionEmbed } from "../../utility/helpers/embed.js";
import { users } from "../../utility/database/data.js";
import { readJSON } from "../../utility/helpers/file.js";

export default (client) => {
  client.on("interactionCreate", async (interaction) => {
    // ───── Modal Submission ─────
    if (interaction.isModalSubmit() && interaction.customId === "appealModal") {
      const reason = interaction.fields.getTextInputValue("appeal_reason")?.trim();
      const serverId = interaction.fields.getTextInputValue("appeal_server")?.trim();

      if (!serverId || !reason) {
        return interaction.reply({
          content: "❌ Missing server ID or reason.",
          ephemeral: true
        });
      }

      const userModel = users([serverId, interaction.user.id]);
      const userData = await userModel.get();
      const punishment = userData?.punishment;
      const punished = punishment && (punishment.evading || (punishment.time && punishment.time > Date.now()));

      if (!punished) {
        const embed = reaxionEmbed()
          .setTitle("❌ Not Punished")
          .setDescription("You are not currently punished in that server.")
          .setColor(Colors.Red);
        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const servers = readJSON("servers.json");
      const channelId = servers?.[serverId]?.set?.appeal?.channel;
      const guild = client.guilds.cache.get(serverId);
      const appealChannel = guild?.channels.cache.get(channelId);

      if (!appealChannel || !appealChannel.isTextBased()) {
        return await interaction.reply({
          content: "❌ Appeal channel is missing or invalid.",
          ephemeral: true
        });
      }

      const minutesLeft = Math.max(1, Math.floor((punishment.time - Date.now()) / 60000));

      const embed = reaxionEmbed()
        .setTitle("📩 New Appeal Submitted")
        .setDescription(`User: ${interaction.user.tag} (${interaction.user.id})`)
        .addFields(
          { name: "Reason", value: reason },
          { name: "Server", value: guild.name },
          { name: "Punishment Duration", value: `${minutesLeft} minutes remaining`, inline: true }
        )
        .setColor(Colors.Yellow)
        .setTimestamp();

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`appeal-accept-${serverId}-${interaction.user.id}`)
          .setLabel("✅ Accept")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`appeal-deny-${serverId}-${interaction.user.id}`)
          .setLabel("❌ Deny")
          .setStyle(ButtonStyle.Danger)
      );

      await appealChannel.send({ embeds: [embed], components: [buttons] });

      const success = reaxionEmbed()
        .setTitle("✅ Appeal Submitted")
        .setDescription("Your appeal has been sent to the server's staff.")
        .setColor(Colors.Green);

      await interaction.reply({ embeds: [success], ephemeral: true });
    }

    // ───── Button Interaction ─────
    if (interaction.isButton()) {
      const [prefix, action, guildId, userId] = interaction.customId.split("-");
      if (prefix !== "appeal") return;

      const guild = client.guilds.cache.get(guildId);
      const member = await guild?.members.fetch(userId).catch(() => null);
      const userModel = users([guildId, userId]);

      if (!member) {
        return await interaction.reply({
          content: "⚠️ Member no longer exists in the server.",
          ephemeral: true
        });
      }

      const message = interaction.message;
      const originalEmbed = message.embeds?.[0];

      if (!originalEmbed) {
        return await interaction.reply({
          content: "❌ Could not retrieve original appeal message.",
          ephemeral: true
        });
      }

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("appeal-status-accept")
          .setLabel("✅ Accepted")
          .setStyle(ButtonStyle.Success)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("appeal-status-deny")
          .setLabel("❌ Denied")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true)
      );

      if (action === "accept") {
        try {
          await member.timeout(null); // Removes the timeout
          await userModel.update({
            punishment: {
              evading: false,
              time: 0
            }
          });
          

          await interaction.update({
            embeds: [
              reaxionEmbed()
                .setTitle("✅ Appeal Accepted")
                .setDescription(`Punishment removed for ${member.user.tag}.`)
                .setColor(Colors.Green)
                .setTimestamp()
            ],
            components: [disabledRow]
          });

          await member.send("✅ Your appeal has been accepted. Your punishment has been removed.")
            .catch(() => console.warn(`[DM] Blocked by ${member.user.tag}`));
        } catch (err) {
          console.error(`[❌ Error] Failed to remove timeout:`, err);
          await interaction.reply({
            content: "❌ Failed to remove timeout.",
            ephemeral: true
          });
        }
      }

      if (action === "deny") {
        await interaction.update({
          embeds: [
            reaxionEmbed()
              .setTitle("❌ Appeal Denied")
              .setDescription(`${member.user.tag} remains punished.`)
              .setColor(Colors.Red)
              .setTimestamp()
          ],
          components: [disabledRow]
        });

        await member.send("❌ Your appeal was denied. You must wait until the punishment ends.")
          .catch(() => console.warn(`[DM] Blocked by ${member.user.tag}`));
      }
    }
  });
};
