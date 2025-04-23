import { 
    ModalBuilder, 
    TextInputBuilder,
    TextInputStyle, 
    ActionRowBuilder
  } from 'discord.js';
  
  /**
   * A flexible, chainable modal builder
   */
  class ModalHandler {
    /**
     * Create a new modal builder instance
     */
    constructor() {
      this.reset();
    }
  
    /**
     * Reset the modal builder to default state
     * @returns {ModalHandler} The handler instance for chaining
     */
    reset() {
      this.modalData = {
        customId: '',
        title: '',
        fields: [],
        handlers: new Map()
      };
      
      return this;
    }
  
    /**
     * Create a new modal with basic configuration
     * @param {String} customId The modal's custom ID
     * @param {String} title The modal's title
     * @returns {ModalHandler} The handler instance for chaining
     */
    create(customId, title) {
      this.reset();
      this.modalData.customId = customId;
      this.modalData.title = title;
      return this;
    }
  
    /**
     * Add a text input field to the modal
     * @param {Object} field Field configuration 
     * @param {String} field.id Unique field ID
     * @param {String} field.label Field label text
     * @param {String} [field.style='paragraph'] Field style ('short' or 'paragraph')
     * @param {String} [field.placeholder] Placeholder text
     * @param {String} [field.value] Default value
     * @param {Number} [field.minLength] Minimum input length
     * @param {Number} [field.maxLength] Maximum input length
     * @param {Boolean} [field.required=true] Whether the field is required
     * @returns {ModalHandler} The handler instance for chaining
     */
    addField({
      id,
      label,
      style = 'paragraph',
      placeholder = '',
      value = '',
      minLength,
      maxLength,
      required = true
    }) {
      const fieldStyle = style === 'short' ? TextInputStyle.Short : TextInputStyle.Paragraph;
      
      const field = new TextInputBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setStyle(fieldStyle)
        .setRequired(required);
      
      if (placeholder) field.setPlaceholder(placeholder);
      if (value) field.setValue(value);
      if (minLength !== undefined) field.setMinLength(minLength);
      if (maxLength !== undefined) field.setMaxLength(maxLength);
      
      this.modalData.fields.push(field);
      return this;
    }
  
    /**
     * Add multiple fields at once
     * @param {Object[]} fields Array of field configurations
     * @returns {ModalHandler} The handler instance for chaining
     */
    addFields(fields) {
      fields.forEach(field => this.addField(field));
      return this;
    }
  
    /**
     * Set a handler function for when the modal is submitted
     * @param {Function} handler Function to call when modal is submitted
     * @returns {ModalHandler} The handler instance for chaining
     */
    onSubmit(handler) {
      this.modalData.handlers.set(this.modalData.customId, handler);
      return this;
    }
  
    /**
     * Show the modal to the user
     * @param {Object} interaction The interaction to respond with the modal
     * @returns {Promise<void>}
     */
    async show(interaction) {
      const modal = new ModalBuilder()
        .setCustomId(this.modalData.customId)
        .setTitle(this.modalData.title);
      
      // Add fields to modal (each in its own action row)
      this.modalData.fields.forEach(field => {
        const row = new ActionRowBuilder().addComponents(field);
        modal.addComponents(row);
      });
      
      // Show the modal
      await interaction.showModal(modal);
      
      return this;
    }
  
    /**
     * Handle a modal submit interaction
     * @param {Object} interaction Modal submit interaction
     * @returns {Promise<boolean>} Whether the interaction was handled
     */
    async handleSubmit(interaction) {
      if (!interaction.isModalSubmit()) return false;
      
      const handler = this.modalData.handlers.get(interaction.customId);
      if (handler) {
        await handler(interaction);
        return true;
      }
      
      return false;
    }
  
    /**
     * Register the modal handler with a client or command
     * @param {Object} client Discord.js client or interaction handler
     * @returns {ModalHandler} The handler instance for chaining
     */
    register(client) {
      // Save the previous interactionCreate handler
      const prevHandler = client.listeners('interactionCreate').find(
        listener => listener.name === 'modalHandlerInteractionCreate'
      );
      
      if (prevHandler) {
        client.off('interactionCreate', prevHandler);
      }
      
      // Register the new handler
      const handler = async (interaction) => {
        if (interaction.isModalSubmit()) {
          await this.handleSubmit(interaction);
        }
      };
      
      // Name the function for later reference
      Object.defineProperty(handler, 'name', {
        value: 'modalHandlerInteractionCreate'
      });
      
      client.on('interactionCreate', handler);
      
      return this;
    }
  
    /**
     * Extract values from a modal submission
     * @param {Object} interaction Modal submit interaction
     * @returns {Object} Key-value pairs of field IDs and values
     */
    static getValues(interaction) {
      if (!interaction.isModalSubmit()) return {};
      
      const values = {};
      
      for (const [id, value] of interaction.fields.fields) {
        values[id] = value.value;
      }
      
      return values;
    }
  }
  
  // Create a singleton instance
  const modal = new ModalHandler();
  
  export { modal, ModalHandler, TextInputStyle };