import { Colors } from "discord.js";
import { CommandBuilder } from "../../utility/commandBuilder.js";
import { reaxionEmbed } from "../../utility/helpers/embed.js";

export default {
  data: new CommandBuilder()
    .setName("who")
    .setDescription("Learn what EvadeGuard is and why it exists."),

  async execute(interaction) {
    const embed = reaxionEmbed()
      .setTitle("🤖 What is EvadeGuard?")
      .setDescription([
        "**EvadeGuard** is a specialized moderation bot designed to handle punishment evasion in Discord servers.",
        "",
        "🔐 **Why it exists:**",
        "Too often, users leave servers mid-timeout or punishment to escape consequences. EvadeGuard ensures fairness by tracking punishment evasion and reapplying penalties if needed.",
        "",
        "🛠️ **Built on Reaxion:**",
        "EvadeGuard is powered by **Reaxion**, a modern command and moderation framework developed for reliability, clarity, and extensibility. It uses Reaxion’s strong modular structure and embed design for consistency and scalability.",
        "",
        "💡 **Vision:**",
        "To empower moderators with smart automation while promoting a fair environment for all members."
      ].join("\n"))
      .setColor(Colors.Blue)
      .setFooter({ text: "EvadeGuard • Built on Reaxion" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
