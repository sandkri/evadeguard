import { readdirSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Recursively loads all .js handler files in a directory tree.
 * @param {Client} client - The Discord client
 * @param {string} handlersDir - Relative path to the handlers directory
 */
export const loadHandlers = async (client, handlersDir = '../handlers') => {
  const handlersPath = path.join(__dirname, handlersDir);

  const recursivelyLoad = async (dir) => {
    for (const file of readdirSync(dir)) {
      const fullPath = path.join(dir, file);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        await recursivelyLoad(fullPath); // 🔁 Recurse into subfolders
      } else if (file.endsWith('.js')) {
        const modulePath = pathToFileURL(fullPath).href;
        const handler = await import(modulePath);
        if (handler.default) {
          handler.default(client);
        }
      }
    }
  };

  await recursivelyLoad(handlersPath);
};
