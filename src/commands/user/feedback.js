import { Colors, PermissionsBitField } from 'discord.js';
import { CommandBuilder } from '../../utility/commandBuilder.js';
import { modal, TextInputStyle } from '../../utility/interaction/modal.js';
import { EmbedBuilder } from 'discord.js';
import { getChannel } from '../../utility/helpers/channelUtils.js';

export default {
  data: new CommandBuilder()
    .setName('feedback')
    .setDescription('Send feedback to the server staff'),

  async execute(interaction) {
    const customId = `feedback_modal_${interaction.user.id}_${Date.now()}`;
    const channel = await getChannel(interaction.guildId, '1106354080831512597')

    // Create a feedback modal
    modal.create(customId, 'Submit Feedback')
      .addFields([
        {
          id: 'feedback_title',
          label: 'Title',
          style: 'short',
          placeholder: 'Brief summary of your feedback',
          maxLength: 100,
          required: true
        },
        {
          id: 'feedback_details',
          label: 'Details',
          style: 'paragraph',
          placeholder: 'Please provide more details...',
          minLength: 10,
          maxLength: 1000,
          required: true
        },
        {
          id: 'feedback_category',
          label: 'Category',
          style: 'short',
          placeholder: 'e.g., Bug, Feature Request, Question',
          required: false
        }
      ])
      .onSubmit(async (modalInteraction) => {
        try {
          // Get the values from the modal
          const values = {};
          for (const [id, field] of modalInteraction.fields.fields) {
            values[id] = field.value;
          }
          
          // Create a feedback embed
          const feedbackEmbed = new EmbedBuilder()
            .setTitle(`📝 Feedback: ${values.feedback_title}`)
            .setDescription(values.feedback_details)
            .setColor(Colors.Blue)
            .addFields({ name: 'Category', value: values.feedback_category || 'Not specified' })
            .setAuthor({
              name: modalInteraction.user.tag,
              iconURL: modalInteraction.user.displayAvatarURL({ dynamic: true })
            })
            .setFooter({ text: `User ID: ${modalInteraction.user.id}` })
            .setTimestamp();
          
          
          
          
          if (channel) {
            await channel.send({ embeds: [feedbackEmbed] });
          }
          
          // Reply to the user
          await modalInteraction.reply({
            content: '✅ Thank you for your feedback! It has been forwarded to the staff.',
            ephemeral: true
          });
          
        } catch (error) {
          console.error('Error processing feedback:', error);
          
          // Send error response if we haven't replied yet
          if (!modalInteraction.replied && !modalInteraction.deferred) {
            await modalInteraction.reply({
              content: '❌ There was an error submitting your feedback. Please try again later.',
              ephemeral: true
            });
          }
        }
      });
      
    try {
      // Show the modal
      await modal.show(interaction);
    } catch (error) {
      console.error('Error showing modal:', error);
      await interaction.reply({
        content: '❌ There was an error opening the feedback form. Please try again later.',
        ephemeral: true
      });
    }
  }
};