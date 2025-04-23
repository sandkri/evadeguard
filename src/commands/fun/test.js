import { Colors } from "discord.js";
import { CommandBuilder } from "../../utility/commandBuilder.js";
import { reaxionEmbed } from "../../utility/helpers/embed.js";
import { findRoleByName } from "../../utility/helpers/roleUtils.js";

export default {
  data: new CommandBuilder()
    .setName('test')
    .setDescription('test')
    .addStringOption(option =>
      option.setName('input')
            .setDescription('Enter some text')
            .setRequired(true)
    ),

  async execute(interaction) {
    const input = interaction.options.getString('input');
    const role = await findRoleByName(interaction.guildId, "Moderator")
    console.log(role.name)
    await interaction.reply({
      embeds: [
        reaxionEmbed({
          title: 'You entered:',
          description: `\`${input}\``,
          color: Colors.Blurple
        })
      ]
    });
  },
};
