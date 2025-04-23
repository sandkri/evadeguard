import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loadHandlers } from './handlers/handlerLoader.js';
import dotenv from 'dotenv';
import { loadServices } from './services/serviceLoader.js';
import { modal } from './utility/interaction/modal.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences],
});

client.commands = new Collection();

/**
 * Initialize the bot and load all components
 * @returns {Promise<void>}
 */
async function initializeBot() {
  console.log('Initializing bot...');
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');

  // Load commands
  for (const category of readdirSync(commandsPath)) {
    const categoryPath = path.join(commandsPath, category);

    for (const file of readdirSync(categoryPath).filter((f) => ['.js', '.ts'].some(ext => f.endsWith(ext)))) {
      const filePath = pathToFileURL(path.join(categoryPath, file)).href;
      
      try {
        const command = await import(filePath); 

        if (command.default?.data && command.default?.execute) {
          client.commands.set(command.default.data.name, command.default);
          commands.push(command.default.data.toJSON());
        }
      } catch (error) {
        console.error(`Failed to load command from ${file}:`, error);
      }
    }
  }

  // Register slash commands
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log(`Successfully registered ${commands.length} slash commands`);
  } catch (error) {
    console.error('Failed to register commands:', error);
  }

  // Set up event handlers
  client.on('ready', () => console.log(`${client.user.tag} is online.`));

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing command ${interaction.commandName}:`, error);
      
      // Only reply if the interaction hasn't been replied to
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: 'There was an error while executing this command.', 
          ephemeral: true 
        }).catch(console.error);
      }
    }
  });

  // Load handlers and services
  try {
    await loadHandlers(client);
    await loadServices(client);
    await modal.register(client);
  } catch (error) {
    console.error('Error loading handlers or services:', error);
  }

  // Login
  return client.login(process.env.BOT_TOKEN);
}

// Export the client for use in other files
export { client };

// Only run initialization if this file is the main module
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  initializeBot()
    .then(() => console.log('Bot initialization complete'))
    .catch(error => {
      console.error('Failed to initialize bot:', error);
      process.exit(1);
    });
}