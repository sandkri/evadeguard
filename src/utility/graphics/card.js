import { createCanvas, loadImage, registerFont } from "canvas";
import { request } from "undici";
import { getImagePath } from "../helpers/image.js";

function getRequiredXP(level) {
  return 5 * (level ** 2) + 50 * level + 100;
}

async function drawProfileCard(user, level, badges = [], profileInfo = {}, config = {}) {
  const width = 500;
  const height = 180;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const {
    font = {
      username: "bold 28px 'Segoe UI', 'Arial', sans-serif",
      details: "16px 'Segoe UI', 'Arial', sans-serif",
      profile: "14px 'Segoe UI', 'Arial', sans-serif",
      badge: "12px 'Segoe UI', 'Arial', sans-serif"
    },
    positions = {
      avatar: { x: 30, y: 20 },
      badgeStart: { x: 30, y: 100 },
      username: { x: 110, y: 40 },
      details: { x: 110, y: 68 },
      bar: { x: 110, y: 90, width: 300, height: 16 },
      profileInfo: { x: 30, y: 170 }
    },
    colors = {
      background: "#1E1F22",
      triangle: "#00B9BC",
      username: "#FFFFFF",
      details: "#CCCCCC",
      profile: "#AAAAAA",
      badgeText: "#FFFFFF",
      badgeBg: "#5865F2",
      barBg: "#3A3B3C",
      barFill: "#00B9BC"
    }
  } = config;

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

  // Load avatar
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

  // Draw username
  ctx.fillStyle = colors.username;
  ctx.font = font.username;
  const tag = user.username && user.discriminator ? `${user.username}#${user.discriminator}` : user.tag || "Unknown User";
  ctx.fillText(tag, positions.username.x, positions.username.y);

  // Show only Level (no XP)
  ctx.fillStyle = colors.details;
  ctx.font = font.details;
  ctx.fillText(
    `Level: ${level}`,
    positions.details.x,
    positions.details.y
  );

  // Profile info (bio)
  if (profileInfo.bio) {
    ctx.fillStyle = colors.profile;
    ctx.font = font.profile;
    ctx.fillText(profileInfo.bio, positions.profileInfo.x, positions.profileInfo.y);
  }

  // Draw text badges (with per-badge color support)
  ctx.font = font.badge;
  let badgeX = positions.badgeStart.x;
  const badgeY = positions.badgeStart.y;

  for (const badge of badges) {
    const text = (typeof badge === "string" ? badge : badge.label || "Badge").toUpperCase();
    const bgColor = badge.color || colors.badgeBg;
    const textColor = badge.textColor || colors.badgeText;

    const paddingX = 16;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;

    const badgeWidth = textWidth + paddingX * 2;
    const badgeHeight = textHeight + 10;

    // Rounded badge background
    ctx.fillStyle = bgColor;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(badgeX + radius, badgeY);
    ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
    ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
    ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
    ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
    ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
    ctx.lineTo(badgeX, badgeY + radius);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
    ctx.closePath();
    ctx.fill();

    // Centered badge text
    ctx.fillStyle = textColor;
    const textX = badgeX + (badgeWidth - textWidth) / 2;
    const textY = badgeY + (badgeHeight + textHeight) / 2 - textMetrics.actualBoundingBoxDescent;
    ctx.fillText(text, textX, textY);

    badgeX += badgeWidth + 12; // spacing between badges
  }

  return canvas.toBuffer("image/png");
}

export { drawProfileCard };
