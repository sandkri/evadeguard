// graphics/elements/text.js
export function drawText(ctx, t, width, height, debug = false) {
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
      case "center-top": x = (width - textWidth) / 2; y = textHeight + 30; break;
      case "center-bottom": x = (width - textWidth) / 2; y = height - 30; break;
      case "center-left": x = 30; y = height / 2 + textHeight / 2; break;
      case "center-right": x = width - textWidth - 30; y = height / 2 + textHeight / 2; break;
      case "center": x = (width - textWidth) / 2; y = height / 2 + textHeight / 2; break;
      case "center-up": x = (width - textWidth) / 2; y = height / 2 + textHeight / 2 - 40; break;
      case "center-down": x = (width - textWidth) / 2; y = height / 2 + textHeight / 2 + 18; break;
      default: x = t.x || 0; y = t.y || 0;
    }
  
    ctx.fillText(t.text, x, y);
  
    if (debug) {
      ctx.strokeStyle = "red";
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  }
  