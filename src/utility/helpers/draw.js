import { createCanvas, loadImage } from "canvas";

/**
 * Draws a canvas with background and text.
 * @param {Object} options
 * @param {string} options.background - Path to background image
 * @param {number} options.width - Canvas width
 * @param {number} options.height - Canvas height
 * @param {Array} options.text - Array of text configs
 * @param {boolean} [options.debug] - Enable debug mode (draws guides)
 * @returns {Buffer}
 */
export async function draw({ background, width = 700, height = 250, text = [], debug = false }) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const bg = await loadImage(background);
  ctx.drawImage(bg, 0, 0, width, height);

  for (const t of text) {
    drawText(ctx, t, width, height, debug);
  }

  return canvas.toBuffer();
}

/**
 * Draws a text element with alignment logic.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} t
 * @param {string} t.text
 * @param {string} t.align - one of center-top, center-bottom, center-left, center-right, center
 * @param {string} [t.font]
 * @param {string} [t.color]
 * @param {number} width
 * @param {number} height
 * @param {boolean} debug
 */
function drawText(ctx, t, width, height, debug = false) {
  const font = t.font || "bold 32px sans-serif";
  const color = t.color || "#ffffff";
  ctx.font = font;
  ctx.fillStyle = color;

  const metrics = ctx.measureText(t.text);
  const textWidth = metrics.width;
  const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  let x = 0;
  let y = 0;

  switch (t.align) {
    case "center-top":
      x = (width - textWidth) / 2;
      y = textHeight + 30;
      break;
    case "center-bottom":
      x = (width - textWidth) / 2;
      y = height - 30;
      break;
    case "center-left":
      x = 30;
      y = height / 2 + textHeight / 2;
      break;
    case "center-right":
      x = width - textWidth - 30;
      y = height / 2 + textHeight / 2;
      break;
    case "center":
      x = (width - textWidth) / 2;
      y = height / 2 + textHeight / 2;
      break;
    case "center-up":
        x = (width - textWidth) / 2;
        y = height / 2 + textHeight / 2 - 40;
        break;
    case "center-down":
        x = (width - textWidth) / 2;
        y = height / 2 + textHeight / 2 + 18;
        break;
    default:
      x = t.x || 0;
      y = t.y || 0;
  }

  ctx.fillText(t.text, x, y);

  // Optional: Draw debug lines
  if (debug) {
    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}
