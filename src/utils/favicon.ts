const SIZE = 32;
const BADGE_X = SIZE - 2;
const BADGE_Y = 2;

let originalHref: string | null = null;

export function setFaviconBadge(unread: number): void {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) return;

  if (originalHref === null) {
    originalHref = link.href;
  }

  if (unread <= 0) {
    if (originalHref && link.href !== originalHref) {
      link.href = originalHref;
    }
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    drawBadge(ctx, unread);
    link.href = canvas.toDataURL("image/png");
  };
  img.onerror = () => {
    drawBadge(ctx, unread);
    link.href = canvas.toDataURL("image/png");
  };
  img.src = originalHref || "";
}

function drawBadge(ctx: CanvasRenderingContext2D, unread: number): void {
  const text = unread > 99 ? "99+" : String(unread);
  const fontSize = text.length > 2 ? 9 : text.length > 1 ? 10 : 12;

  ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const textHeight = fontSize;

  // Pill-shaped badge
  const paddingX = text.length > 2 ? 3 : text.length > 1 ? 3 : 2;
  const paddingY = 1;
  const badgeW = Math.max(textWidth + paddingX * 2, textHeight + paddingY * 2);
  const badgeH = textHeight + paddingY * 2;
  const radius = badgeH / 2;
  const badgeRight = BADGE_X;
  const badgeLeft = badgeRight - badgeW;
  const badgeTop = BADGE_Y;

  // Draw pill
  ctx.beginPath();
  ctx.moveTo(badgeLeft + radius, badgeTop);
  ctx.lineTo(badgeRight - radius, badgeTop);
  ctx.arc(badgeRight - radius, badgeTop + radius, radius, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(badgeLeft + radius, badgeTop + badgeH);
  ctx.arc(badgeLeft + radius, badgeTop + radius, radius, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();

  // Fill
  ctx.fillStyle = "#ef4444";
  ctx.fill();
  // Border
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Number
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, badgeLeft + badgeW / 2, badgeTop + badgeH / 2);
}
