import { 
    ActionRowBuilder,
    ButtonBuilder,
    StringSelectMenuBuilder,
    EmbedBuilder,
    ComponentType,
    ButtonStyle,
    Colors,
  } from 'discord.js';
  
  // Import InteractionResponseFlags correctly
  import Discord from 'discord.js';
    const { InteractionResponseFlags } = Discord;

  /**
   * Paginator class for creating interactive menu systems
   */
  class Paginator {
    /**
     * Create a new paginator instance
     * @param {Object} options Initial configuration
     */
    constructor(options = {}) {
      this.pages = new Map();
      this.startPageId = 'main';
      this.timeout = options.timeout || 300000; // 5 minutes
      this.ephemeral = options.ephemeral || false;
      this.interaction = null;
      this.response = null;
      this.collector = null;
    }
  
    /**
     * Initialize a paginator with an interaction
     * @param {Object} interaction Discord.js interaction object
     * @returns {Paginator} The paginator instance for chaining
     */
    init(interaction) {
      this.interaction = interaction;
      return this;
    }
  
    /**
     * Set paginator options
     * @param {Object} options Paginator options
     * @param {Number} [options.timeout] Collector timeout in ms
     * @param {Boolean} [options.ephemeral] Whether responses should be ephemeral
     * @param {String} [options.startPage] ID of the starting page
     * @returns {Paginator} The paginator instance for chaining
     */
    setOptions({ timeout, ephemeral, startPage } = {}) {
      if (timeout !== undefined) this.timeout = timeout;
      if (ephemeral !== undefined) this.ephemeral = ephemeral;
      if (startPage) this.startPageId = startPage;
      return this;
    }
  
    /**
     * Create a new page for the menu
     * @param {String} id Unique identifier for the page
     * @param {Object} options Page configuration
     * @returns {Object} The created page object (for chaining)
     */
    page(id, options = {}) {
      const page = {
        id,
        title: options.title || 'Menu',
        description: options.description || '',
        color: options.color || Colors.Blue,
        fields: options.fields || [],
        options: options.options || [],
        buttons: options.buttons || [],
        components: options.components || null,
        handlers: options.handlers || {},
        backTo: options.backTo || null,
        embed: options.embed || null,
        footer: options.footer || null,
        thumbnail: options.thumbnail || null,
        image: options.image || null,
        placeholder: options.placeholder || 'Select an option',
        showCloseButton: options.showCloseButton !== false,
        onDisplay: options.onDisplay || null
      };
  
      this.pages.set(id, page);
      return page;
    }
  
    /**
     * Add a button to a page
     * @param {String} pageId The ID of the page to add the button to
     * @param {Object} button Button configuration
     * @returns {Paginator} The paginator instance for chaining
     */
    addButton(pageId, button) {
      const page = this.pages.get(pageId);
      if (!page) throw new Error(`Page "${pageId}" not found`);
      
      if (!page.buttons) page.buttons = [];
      page.buttons.push(button);
      
      return this;
    }
  
    /**
     * Add a select menu option to a page
     * @param {String} pageId The ID of the page to add the option to
     * @param {Object} option Select menu option configuration
     * @returns {Paginator} The paginator instance for chaining
     */
    addOption(pageId, option) {
      const page = this.pages.get(pageId);
      if (!page) throw new Error(`Page "${pageId}" not found`);
      
      if (!page.options) page.options = [];
      page.options.push(option);
      
      return this;
    }
  
    /**
     * Add a custom handler for a component
     * @param {String} pageId The ID of the page to add the handler to
     * @param {String} componentId The custom ID of the component
     * @param {Function} handler The handler function
     * @returns {Paginator} The paginator instance for chaining
     */
    addHandler(pageId, componentId, handler) {
      const page = this.pages.get(pageId);
      if (!page) throw new Error(`Page "${pageId}" not found`);
      
      if (!page.handlers) page.handlers = {};
      page.handlers[componentId] = handler;
      
      return this;
    }
  
    /**
     * Send the menu and start the interaction
     * @returns {Promise<Object>} Result with collector and response
     */
    async render() {
      if (!this.interaction) {
        throw new Error('No interaction provided. Call init() first');
      }
  
      if (this.pages.size === 0) {
        throw new Error('No pages defined. Create pages with page()');
      }
  
      // Ensure the start page exists
      if (!this.pages.has(this.startPageId)) {
        throw new Error(`Start page "${this.startPageId}" not found in page definitions`);
      }
      
      // Send initial message with the first page
      const startPage = this.pages.get(this.startPageId);
      
      // Use ephemeral directly instead of flags
      this.response = await this.interaction.reply({
        embeds: [this._buildEmbed(startPage)],
        components: this._buildComponents(startPage),
        ephemeral: this.ephemeral,
        fetchReply: true
      });
      
      // Call onDisplay handler if present
      if (startPage.onDisplay) {
        await startPage.onDisplay(this.interaction, this.response);
      }
      
      // Set up collector for components
      this.collector = this.response.createMessageComponentCollector({
        time: this.timeout
      });
      
      // Keep track of the current page
      let currentPageId = this.startPageId;
      
      // Handle all component interactions
      this.collector.on('collect', async i => {
        try {
          // Make sure only the original user can interact
          if (i.user.id !== this.interaction.user.id) {
            return i.reply({
              content: '❌ These controls belong to someone else.',
              ephemeral: true
            });
          }
          
          // Handle navigation to a page
          if (i.customId === 'page_select') {
            const selectedPageId = i.values[0];
            currentPageId = selectedPageId;
            
            const selectedPage = this.pages.get(selectedPageId);
            
            await i.update({
              embeds: [this._buildEmbed(selectedPage)],
              components: this._buildComponents(selectedPage)
            });
            
            // Call onDisplay handler if present
            if (selectedPage.onDisplay) {
              await selectedPage.onDisplay(this.interaction, this.response);
            }
            
            return;
          }
          
          // Handle navigation button (back button, etc)
          if (i.customId.startsWith('goto_')) {
            const targetPageId = i.customId.replace('goto_', '');
            currentPageId = targetPageId;
            
            const targetPage = this.pages.get(targetPageId);
            
            await i.update({
              embeds: [this._buildEmbed(targetPage)],
              components: this._buildComponents(targetPage)
            });
            
            // Call onDisplay handler if present
            if (targetPage.onDisplay) {
              await targetPage.onDisplay(this.interaction, this.response);
            }
            
            return;
          }
          
          // Handle exit/close button
          if (i.customId === 'close_menu') {
            const exitEmbed = new EmbedBuilder()
              .setTitle("Menu Closed")
              .setDescription("This interactive menu has been closed.")
              .setColor(Colors.Grey);
            
            await i.update({
              embeds: [exitEmbed],
              components: []
            });
            
            this.collector.stop('closed');
            return;
          }
          
          // Handle custom button or component actions
          const currentPage = this.pages.get(currentPageId);
          
          // If the page has a custom handler for this component
          if (currentPage.handlers && currentPage.handlers[i.customId]) {
            await currentPage.handlers[i.customId](i, this.collector, this.pages);
          }
          
        } catch (error) {
          console.error('Error handling menu interaction:', error);
          await i.reply({
            content: 'There was an error processing your action.',
            ephemeral: true
          }).catch(() => {}); // Ignore if we can't reply (already replied)
        }
      });
      
      // Handle collection end (timeout, etc)
      this.collector.on('end', async (collected, reason) => {
        if (reason !== 'closed' && reason !== 'messageDelete') {
          try {
            const timeoutEmbed = new EmbedBuilder()
              .setTitle("⏱️ Interaction Timed Out")
              .setDescription("This menu is no longer active due to inactivity.")
              .setColor(Colors.Red);
            
            await this.interaction.editReply({
              embeds: [timeoutEmbed],
              components: []
            });
          } catch (error) {
            // Ignore errors if message was deleted
            console.error('Error sending timeout message:', error);
          }
        }
      });
      
      // Return the collector and response for external handling
      return { collector: this.collector, response: this.response };
    }
  
    /**
     * Build an embed from a page definition
     * @param {Object} page The page object
     * @returns {EmbedBuilder} The created embed
     * @private
     */
    _buildEmbed(page) {
      // If a full embed is provided, use it
      if (page.embed instanceof EmbedBuilder) {
        return page.embed;
      }
      
      // Otherwise build one from the page properties
      const embed = new EmbedBuilder()
        .setTitle(page.title || 'Menu')
        .setDescription(page.description || '')
        .setColor(page.color || Colors.Blue);
      
      // Add fields if provided
      if (page.fields && Array.isArray(page.fields)) {
        embed.addFields(page.fields);
      }
      
      // Add footer if provided
      if (page.footer) {
        embed.setFooter(page.footer);
      }
      
      // Add thumbnail if provided
      if (page.thumbnail) {
        embed.setThumbnail(page.thumbnail);
      }
      
      // Add image if provided
      if (page.image) {
        embed.setImage(page.image);
      }
      
      return embed;
    }
  
    /**
     * Build components for a page
     * @param {Object} page Current page object
     * @returns {ActionRowBuilder[]} Array of component rows
     * @private
     */
    _buildComponents(page) {
      const components = [];
      
      // If the page provides custom components, use those
      if (page.components && Array.isArray(page.components)) {
        return page.components;
      }
      
      // Add navigation options if provided
      if (page.options && page.options.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('page_select')
          .setPlaceholder(page.placeholder || 'Select an option')
          .addOptions(page.options);
        
        components.push(new ActionRowBuilder().addComponents(selectMenu));
      }
      
      // Add navigation buttons
      const buttonRow = new ActionRowBuilder();
      
      // Add custom buttons if specified
      if (page.buttons && page.buttons.length > 0) {
        for (const buttonConfig of page.buttons) {
          const button = new ButtonBuilder()
            .setCustomId(buttonConfig.id)
            .setLabel(buttonConfig.label)
            .setStyle(buttonConfig.style || ButtonStyle.Secondary);
          
          if (buttonConfig.emoji) {
            button.setEmoji(buttonConfig.emoji);
          }
          
          if (buttonConfig.disabled) {
            button.setDisabled(true);
          }
          
          buttonRow.addComponents(button);
        }
      }
      
      // Add back button if back page is specified
      if (page.backTo) {
        buttonRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`goto_${page.backTo}`)
            .setLabel('Back')
            .setStyle(ButtonStyle.Secondary)
        );
      }
      
      // Add close button if not disabled
      if (page.showCloseButton !== false) {
        buttonRow.addComponents(
          new ButtonBuilder()
            .setCustomId('close_menu')
            .setLabel('Close')
            .setStyle(ButtonStyle.Danger)
        );
      }
      
      // Add the button row if it has components
      if (buttonRow.components.length > 0) {
        components.push(buttonRow);
      }
      
      return components;
    }
  }
  
  // Create a singleton instance
  const paginator = new Paginator();
  
  // Export named elements for easier imports
  export { paginator, Paginator, EmbedBuilder, ButtonStyle, Colors };
  
  // For backward compatibility
  export async function createMenu(options) {
    const { interaction, pages, startPage, timeout, ephemeral } = options;
    
    const menuPaginator = new Paginator({ timeout, ephemeral });
    menuPaginator.init(interaction);
    
    if (startPage) {
      menuPaginator.startPageId = startPage;
    }
    
    // Convert the array of pages to paginator pages
    pages.forEach(page => {
      menuPaginator.page(page.id, page);
    });
    
    return menuPaginator.render();
  }