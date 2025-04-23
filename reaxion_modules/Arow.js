import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    StringSelectMenuBuilder,
    SelectMenuOptionBuilder,
    TextInputBuilder,
    TextInputStyle
  } from "discord.js";
  
  /**
   * Enhanced ActionRowBuilder with smart component generation and styling
   */
  class ReaxionRow extends ActionRowBuilder {
    /**
     * Create a new enhanced action row builder
     */
    constructor() {
      super();
      this.components = [];
    }
  
    /**
     * Add a button with automatic style detection
     * @param {String|Object} config Button ID or full configuration
     * @param {String} [label] Button label (if first param is ID)
     * @returns {ReaxionRow} This row for chaining
     */
    button(config, label) {
      // Handle different calling patterns
      let options = {};
      
      // If config is a string, it's the customId
      if (typeof config === 'string') {
        options.id = config;
        if (label) options.label = label;
      } 
      // If config is an object, use it directly
      else if (typeof config === 'object') {
        options = config;
      }
  
      // Create the button
      const button = new ButtonBuilder();
      
      // Set customId or URL based on what's provided
      if (options.url) {
        button.setURL(options.url);
        button.setStyle(ButtonStyle.Link);
      } else {
        button.setCustomId(options.id || `button_${Date.now()}`);
        
        // Auto-detect style based on keywords in ID or label
        const styleText = (options.id || '') + (options.label || '');
        button.setStyle(this._detectButtonStyle(options.style, styleText));
      }
      
      // Set label if provided
      if (options.label) {
        button.setLabel(options.label);
      }
      
      // Set emoji if provided
      if (options.emoji) {
        button.setEmoji(options.emoji);
      }
      
      // Set disabled state if provided
      if (options.disabled) {
        button.setDisabled(true);
      }
      
      // Add the button to the row
      this.addComponents(button);
      return this;
    }
    
    /**
     * Add a primary (blue) button
     * @param {String|Object} config Button ID or configuration
     * @param {String} [label] Button label
     * @returns {ReaxionRow} This row for chaining
     */
    primary(config, label) {
      const options = typeof config === 'string' ? { id: config, label } : config;
      return this.button({ ...options, style: 'primary' });
    }
    
    /**
     * Add a secondary (gray) button
     * @param {String|Object} config Button ID or configuration
     * @param {String} [label] Button label
     * @returns {ReaxionRow} This row for chaining
     */
    secondary(config, label) {
      const options = typeof config === 'string' ? { id: config, label } : config;
      return this.button({ ...options, style: 'secondary' });
    }
    
    /**
     * Add a success (green) button
     * @param {String|Object} config Button ID or configuration
     * @param {String} [label] Button label
     * @returns {ReaxionRow} This row for chaining
     */
    success(config, label) {
      const options = typeof config === 'string' ? { id: config, label } : config;
      return this.button({ ...options, style: 'success' });
    }
    
    /**
     * Add a danger (red) button
     * @param {String|Object} config Button ID or configuration
     * @param {String} [label] Button label
     * @returns {ReaxionRow} This row for chaining
     */
    danger(config, label) {
      const options = typeof config === 'string' ? { id: config, label } : config;
      return this.button({ ...options, style: 'danger' });
    }
    
    /**
     * Add a link button
     * @param {String} url Button URL
     * @param {String|Object} labelOrConfig Button label or configuration
     * @returns {ReaxionRow} This row for chaining
     */
    link(url, labelOrConfig) {
      const options = typeof labelOrConfig === 'string' 
        ? { label: labelOrConfig } 
        : (labelOrConfig || {});
      
      return this.button({ ...options, url });
    }
    
    /**
     * Add a select menu with simplified options
     * @param {String|Object} config Select menu ID or configuration
     * @param {Array} [options] Menu options if first param is ID
     * @returns {ReaxionRow} This row for chaining
     */
    select(config, options) {
      // Handle different calling patterns
      let menuOptions = {};
      let menuItems = [];
      
      // If config is a string, it's the customId
      if (typeof config === 'string') {
        menuOptions.id = config;
        if (Array.isArray(options)) menuItems = options;
      } 
      // If config is an object, use it directly
      else if (typeof config === 'object') {
        menuOptions = config;
        if (Array.isArray(menuOptions.options)) {
          menuItems = menuOptions.options;
          delete menuOptions.options;
        }
      }
      
      // Create the select menu
      const menu = new StringSelectMenuBuilder()
        .setCustomId(menuOptions.id || `select_${Date.now()}`);
      
      // Set placeholder if provided
      if (menuOptions.placeholder) {
        menu.setPlaceholder(menuOptions.placeholder);
      }
      
      // Set min/max values if provided
      if (menuOptions.min !== undefined) {
        menu.setMinValues(menuOptions.min);
      }
      
      if (menuOptions.max !== undefined) {
        menu.setMaxValues(menuOptions.max);
      }
      
      // Set disabled state if provided
      if (menuOptions.disabled) {
        menu.setDisabled(true);
      }
      
      // Add options
      if (menuItems.length > 0) {
        const processedOptions = menuItems.map(item => {
          if (typeof item === 'string') {
            // If item is just a string, use it as both label and value
            return { label: item, value: item };
          }
          return item;
        });
        
        // Add options to menu
        menu.addOptions(processedOptions);
      }
      
      // Add the select menu to the row
      this.addComponents(menu);
      return this;
    }
    
    /**
     * Add a text input field (for modals)
     * @param {String|Object} config Text input ID or configuration
     * @param {String} [label] Input label if first param is ID
     * @returns {ReaxionRow} This row for chaining
     */
    textInput(config, label) {
      // Handle different calling patterns
      let options = {};
      
      // If config is a string, it's the customId
      if (typeof config === 'string') {
        options.id = config;
        if (label) options.label = label;
      } 
      // If config is an object, use it directly
      else if (typeof config === 'object') {
        options = config;
      }
      
      // Create the text input
      const input = new TextInputBuilder()
        .setCustomId(options.id || `input_${Date.now()}`)
        .setLabel(options.label || 'Input')
        .setStyle(options.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short)
        .setRequired(options.required !== false);
      
      // Set placeholder if provided
      if (options.placeholder) {
        input.setPlaceholder(options.placeholder);
      }
      
      // Set value if provided
      if (options.value) {
        input.setValue(options.value);
      }
      
      // Set min/max length if provided
      if (options.minLength !== undefined) {
        input.setMinLength(options.minLength);
      }
      
      if (options.maxLength !== undefined) {
        input.setMaxLength(options.maxLength);
      }
      
      // Add the text input to the row
      this.addComponents(input);
      return this;
    }
    
    /**
     * Create a paragraph text input
     * @param {String|Object} config Input ID or configuration
     * @param {String} [label] Input label if first param is ID
     * @returns {ReaxionRow} This row for chaining
     */
    paragraph(config, label) {
      const options = typeof config === 'string' ? { id: config, label } : config;
      return this.textInput({ ...options, style: 'paragraph' });
    }
    
    /**
     * Create a short text input
     * @param {String|Object} config Input ID or configuration
     * @param {String} [label] Input label if first param is ID
     * @returns {ReaxionRow} This row for chaining
     */
    short(config, label) {
      const options = typeof config === 'string' ? { id: config, label } : config;
      return this.textInput({ ...options, style: 'short' });
    }
    
    /**
     * Auto-detect appropriate button style based on context
     * @param {String} explicitStyle Style explicitly set by the user
     * @param {String} textContext Text to analyze for style hints
     * @returns {ButtonStyle} The appropriate button style
     * @private
     */
    _detectButtonStyle(explicitStyle, textContext) {
      // If style is explicitly set, use that
      if (explicitStyle) {
        const styles = {
          'primary': ButtonStyle.Primary,
          'secondary': ButtonStyle.Secondary,
          'success': ButtonStyle.Success,
          'danger': ButtonStyle.Danger,
          'link': ButtonStyle.Link,
          'blue': ButtonStyle.Primary,
          'gray': ButtonStyle.Secondary,
          'grey': ButtonStyle.Secondary,
          'green': ButtonStyle.Success,
          'red': ButtonStyle.Danger
        };
        
        return styles[explicitStyle.toLowerCase()] || ButtonStyle.Primary;
      }
      
      // Try to detect style from text
      const text = textContext.toLowerCase();
      
      if (/cancel|close|exit|delete|remove|stop|abort|deny|reject|decline|no/.test(text)) {
        return ButtonStyle.Danger;
      }
      
      if (/ok|accept|confirm|submit|save|yes|approve|continue|next|proceed|create|add/.test(text)) {
        return ButtonStyle.Success;
      }
      
      if (/back|return|prev|previous/.test(text)) {
        return ButtonStyle.Secondary;
      }
      
      // Default to primary
      return ButtonStyle.Primary;
    }
  }
  
  /**
   * Create a new enhanced action row
   * @returns {ReaxionRow} A new enhanced action row
   */
  export function row() {
    return new ReaxionRow();
  }
  
  /**
   * Create button row with multiple buttons
   * @param {...Object} buttons Button configurations
   * @returns {ReaxionRow} An action row with the specified buttons
   */
  export function buttons(...buttonConfigs) {
    const actionRow = new ReaxionRow();
    
    for (const config of buttonConfigs) {
      actionRow.button(config);
    }
    
    return actionRow;
  }
  
  /**
   * Create a single button with auto-detection of style
   * @param {Object} config Button configuration
   * @returns {ReaxionRow} An action row with a single button
   */
  export function button(config) {
    return new ReaxionRow().button(config);
  }
  
  /**
   * Create a select menu row
   * @param {String|Object} idOrConfig Menu ID or configuration object
   * @param {Array} [options] Select menu options if first param is ID
   * @returns {ReaxionRow} An action row with a select menu
   */
  export function select(idOrConfig, options) {
    return new ReaxionRow().select(idOrConfig, options);
  }
  
  /**
   * Create a text input row
   * @param {String|Object} idOrConfig Input ID or configuration object
   * @param {String} [label] Input label if first param is ID
   * @returns {ReaxionRow} An action row with a text input
   */
  export function textInput(idOrConfig, label) {
    return new ReaxionRow().textInput(idOrConfig, label);
  }
  
  // Export everything
  export { ReaxionRow };