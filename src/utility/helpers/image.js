import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseImageDir = path.join(__dirname, '..', '..', 'assets', 'images');

/**
 * Get full path to image inside optional subfolder.
 * @param {string} filename
 * @param {string} [subfolder]
 */
export function getImagePath(filename, subfolder = '') {
  const folderPath = path.join(baseImageDir, subfolder);
  const fullPath = path.join(folderPath, filename);
  return fs.existsSync(fullPath) ? fullPath : null;
}

/**
 * Check if image exists inside optional subfolder.
 * @param {string} filename
 * @param {string} [subfolder]
 */
export function imageExists(filename, subfolder = '') {
  return !!getImagePath(filename, subfolder);
}

/**
 * List images in a folder or subfolder.
 * @param {string} [subfolder]
 */
export function listImages(subfolder = '') {
  const folderPath = path.join(baseImageDir, subfolder);
  if (!fs.existsSync(folderPath)) {
    console.warn(`⚠️ Image folder not found: ${folderPath}`);
    return [];
  }

  return fs.readdirSync(folderPath).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext);
  });
}

/**
 * Get a random image path from a subfolder.
 * @param {string} [subfolder]
 */
export function getRandomImagePath(subfolder = '') {
  const images = listImages(subfolder);
  if (images.length === 0) return null;
  const selected = images[Math.floor(Math.random() * images.length)];
  return path.join(baseImageDir, subfolder, selected);
}
