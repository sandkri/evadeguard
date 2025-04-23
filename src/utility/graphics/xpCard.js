import { createCanvas, loadImage, registerFont } from "canvas";
import { request } from "undici";
import { getImagePath } from "../helpers/image.js";
import { getRequiredXP } from "../helpers/essentials/calculations.js";


function formatXP(value) {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9)  return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6)  return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3)  return `${(value / 1e3).toFixed(1)}K`;
    return `${value}`;
  }
  
async function drawXPCard(user, level, xp, config = {}) {
  const width = 500;
  const height = 150;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const {
    font = {
      username: "bold 28px 'Segoe UI', 'Arial', sans-serif",
      details: "16px 'Segoe UI', 'Arial', sans-serif"
    },
    positions = {
      avatar: { x: 30, y: 20 },
      username: { x: 110, y: 40 },
      details: { x: 110, y: 68 },
      bar: { x: 110, y: 90, width: 300, height: 16 }
    },
    colors = {
      background: "#1E1F22",
      triangle: "#00B9BC",
      username: "#FFFFFF",
      details: "#CCCCCC",
      barBg: "#3A3B3C",
      barFill: "#00B9BC"
    }
  } = config;

  const nextXP = getRequiredXP(level + 1);
  const progress = Math.min(xp / nextXP, 1);

  const bgPath = getImagePath("header.png");
  if (bgPath) {
    try {
      const background = await loadImage(bgPath);
      ctx.drawImage(background, 0, 0, width, height);
    } catch {
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.fillStyle = colors.triangle;
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height);
  ctx.lineTo(width - 70, height);
  ctx.closePath();
  ctx.fill();

  let avatar;
  try {
    const avatarURL = user.displayAvatarURL?.({ extension: "png", size: 128 });
    const res = await request(avatarURL);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw new Error("Invalid avatar");
    const buffer = Buffer.from(await res.body.arrayBuffer());
    avatar = await loadImage(buffer);
  } catch {
    avatar = null;
  }

  const avatarSize = 64;
  const avatarX = positions.avatar.x;
  const avatarY = positions.avatar.y;

  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    ctx.restore();
  }

  ctx.fillStyle = colors.username;
  ctx.font = font.username;
  const tag = user.username|| "Unknown User";
  ctx.fillText(tag, positions.username.x, positions.username.y);

  ctx.fillStyle = colors.details;
  ctx.font = font.details;
  ctx.fillText(
    `Level: ${level}   XP: ${formatXP(xp)} / ${formatXP(nextXP)}`,
    positions.details.x,
    positions.details.y
  );
  

    // Bar background
    ctx.fillStyle = colors.barBg;
    ctx.fillRect(positions.bar.x, positions.bar.y, positions.bar.width, positions.bar.height);

    // Bar fill
    ctx.fillStyle = colors.barFill;
    ctx.fillRect(positions.bar.x, positions.bar.y, positions.bar.width * progress, positions.bar.height);

    // Bar outline
    ctx.strokeStyle = colors.barFill;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(positions.bar.x, positions.bar.y, positions.bar.width, positions.bar.height);

  return canvas.toBuffer("image/png");
}

export { drawXPCard };
