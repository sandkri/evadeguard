import { EmbedBuilder, FormattingPatterns, Formatters, bold } from "discord.js";

class ReaxionBuilder extends EmbedBuilder {
  constructor({ title, description, color, footer } = {}) {
    super();

    // Basic embed setup
    if (title) this.setTitle(title);
    if (description) this.setDescription(description);
    if (color) this.setColor(color);
    if (footer !== null) {
      this.setFooter({ text: footer || "Reaxion" });
    }
  }

  // Add a single field
  addField(name, value, inline = false) {
    this.addFields({ name, value, inline });
    return this;
  }

  // Add multiple fields at once
  addFieldsArray(fields = []) {
    this.addFields(fields);
    return this;
  }

  // Stylized header for levels/info pages
  useLevelStyle(descriptionText) {
    this.setDescription(descriptionText);
    this.setColor(0x5865f2); // Discord blurple
    return this;
  }

  // Adds a channel-style header: e.g. 🌟・Level Roles & Perks
  addTreeHeader(text, emoji = "📌") {
    const header = `**${emoji}・${text}**`;
    this.addFields({ name: header, value: "\u200b ", inline: false }); // invisible char to force spacing
    return this;
  }

  // Add a styled level field like:
  // Level 5 -> 🧩 @Role
  //            Access to #channel
  addSubEntryField(title, roleMention, description, inline = true) {
    const emojiOne = "<:sub_entry_one:1360508842412347523>";
    const emojiTwo = "<:sub_entry_two:1360508800469041264>";
  
    const value = [
      `${emojiOne} ${roleMention}`,
      `${emojiTwo} ${description}`
    ].join("\n");
  
    this.addFields({ name: `**${title}**`, value, inline });
    return this;
  }

  addBulletEntry(header, description) {
    const bullet = "<:bullet_point:1360524552584827050>";
    const emojiTwo = "<:sub_entry_two:1360508800469041264>";
  
    const current = this.data.description || "";
    const updated = `${current}\n${bullet} ${bold(header)}\n${emojiTwo} ${description}\n`;
    this.setDescription(updated);
    return this;
  }
  
  addDescriptionDivider(emojiId = "1360508812263690240", repeat = 27) {
    const divider = `<:divider:${emojiId}>`.repeat(repeat);
    const current = this.data.description || "";
    const updated = current.length ? `${current}\n${divider}` : divider;
    this.setDescription(updated);
    return this;
  }
  
  
  
  
  
  

  // Predefined embed themes
  setPreset(type, content) {
    const presets = {
      error:   { title: "❌ Error", color: 0xff4d4d },
      success: { title: "✅ Success", color: 0x4caf50 },
      info:    { title: "ℹ️ Info", color: 0x0099ff },
      warning: { title: "⚠️ Warning", color: 0xffc107 },
    };

    const preset = presets[type];
    if (preset) {
      this.setTitle(`${preset.title} | ${content}`);
      this.setColor(preset.color);
    }
    return this;
  }
}

// Export the embed factory
export function reaxionEmbed(options = {}) {
  return new ReaxionBuilder(options);
}
