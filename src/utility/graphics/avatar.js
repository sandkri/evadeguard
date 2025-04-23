import { request } from "undici";
import { loadImage } from "canvas";

/**
 * Draw a circular avatar on canvas.
 * @param {CanvasRenderingContext2D} ctx - The canvas context
 * @param {Object} user - A Discord user object with displayAvatarURL()
 * @param {number} x - Top-left X position
 * @param {number} y - Top-left Y position
 * @param {number} size - Diameter of the avatar
 */
export async function drawAvatar(ctx, user, x, y, size = 64) {
  try {
    const avatarURL = user.displayAvatarURL?.({ extension: "png", size: 128 });
    const res = await request(avatarURL);
    const buffer = Buffer.from(await res.body.arrayBuffer());
    const avatar = await loadImage(buffer);

    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, x, y, size, size);
    ctx.restore();
  } catch (err) {
    console.error("❌ Failed to load avatar:", err);
  }
}
