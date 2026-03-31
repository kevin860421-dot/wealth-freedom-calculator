/**
 * 財富自由分享圖生成器（獨立工具，不耦合計算機）
 * - HTML5 Canvas
 * - 1:1 預設 1080x1080
 * - 右下預留 200x200 QR 區（可傳入 qrImage 繪製）
 */

export const SHARE_STYLES = /** @type {const} */ ({
  flex: "flex", // 炫耀版 - 成就解鎖風
  reality: "reality", // 扎心版 - 現實覺醒風
  comic: "comic", // 反差版 - 跌破眼鏡風
});

/**
 * @typedef {Object} ShareData
 * @property {number} currentAge
 * @property {number} retireAge
 * @property {number} yearsLeft
 * @property {number} passiveIncomeRate
 * @property {number} monthlySalary
 */

/**
 * @typedef {Object} ShareStyleOptions
 * @property {"flex"|"reality"|"comic"} style
 * @property {number=} size
 * @property {number=} padding
 * @property {string=} siteName
 * @property {HTMLImageElement|ImageBitmap|null=} qrImage
 * @property {string=} qrLabel
 */

/** @typedef {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, toDataURL: (type?: string, quality?: number) => string, toBlob: (type?: string, quality?: number) => Promise<Blob> }} ShareImageResult */

const DEFAULTS = {
  size: 1080,
  padding: 64,
  siteName: "財富自由計算機",
  qrSize: 200,
  qrGap: 18,
};

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function dprCanvas(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("CanvasRenderingContext2D not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

function withShadow(ctx, { color, blur, dx = 0, dy = 0 }, fn) {
  const prev = {
    shadowColor: ctx.shadowColor,
    shadowBlur: ctx.shadowBlur,
    shadowOffsetX: ctx.shadowOffsetX,
    shadowOffsetY: ctx.shadowOffsetY,
  };
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = dx;
  ctx.shadowOffsetY = dy;
  try {
    fn();
  } finally {
    ctx.shadowColor = prev.shadowColor;
    ctx.shadowBlur = prev.shadowBlur;
    ctx.shadowOffsetX = prev.shadowOffsetX;
    ctx.shadowOffsetY = prev.shadowOffsetY;
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawNoise(ctx, x, y, w, h, intensity = 0.06, seed = 1337) {
  // 低成本 noise：用小顆粒散點（避免每像素操作太慢）
  const count = Math.floor((w * h) / 2400);
  let s = seed >>> 0;
  const rand = () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  ctx.save();
  ctx.globalAlpha = intensity;
  for (let i = 0; i < count; i++) {
    const px = x + rand() * w;
    const py = y + rand() * h;
    const a = rand();
    ctx.fillStyle = a < 0.5 ? "#000000" : "#ffffff";
    ctx.fillRect(px, py, 1, 1);
  }
  ctx.restore();
}

function fitFont(ctx, text, { maxWidth, maxSize, minSize, fontFamily, weight = 800 }) {
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  /** @type {string[]} */
  const lines = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${cur} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) cur = next;
    else {
      lines.push(cur);
      cur = words[i];
    }
  }
  lines.push(cur);
  return lines;
}

function drawCenteredBlock(ctx, { x, y, w, align = "center", color = "#fff", stroke = null, lineWidth = 6, font, lines, lineHeight }) {
  ctx.save();
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.font = font;
  ctx.fillStyle = color;
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
  }
  const totalH = (lines.length - 1) * lineHeight;
  const cy0 = y - totalH / 2;
  const cx = x + w / 2;
  for (let i = 0; i < lines.length; i++) {
    const ly = cy0 + i * lineHeight;
    const t = lines[i];
    if (stroke) ctx.strokeText(t, cx, ly);
    ctx.fillText(t, cx, ly);
  }
  ctx.restore();
}

function drawQrSlot(ctx, { size, padding, siteName, qrSize, qrGap, qrImage, qrLabel }) {
  const x0 = padding;
  const y0 = size - padding;
  const slotX = size - padding - qrSize;
  const slotY = size - padding - qrSize;

  // 網站名稱（左下）
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = `700 34px ui-sans-serif, system-ui, -apple-system, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei"`;
  ctx.fillText(siteName, x0, y0);
  ctx.restore();

  // QR 區（右下）
  ctx.save();
  roundRectPath(ctx, slotX, slotY, qrSize, qrSize, 22);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.stroke();

  if (qrImage) {
    // 內縮一些，避免貼邊
    const inset = 12;
    const imgX = slotX + inset;
    const imgY = slotY + inset;
    const imgS = qrSize - inset * 2;
    ctx.save();
    roundRectPath(ctx, imgX, imgY, imgS, imgS, 16);
    ctx.clip();
    ctx.drawImage(qrImage, imgX, imgY, imgS, imgS);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 22px ui-sans-serif, system-ui, -apple-system, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei"`;
    ctx.fillText("QR", slotX + qrSize / 2, slotY + qrSize / 2 - 8);
    ctx.font = `500 14px ui-sans-serif, system-ui, -apple-system, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei"`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(qrLabel || "（預留區）", slotX + qrSize / 2, slotY + qrSize / 2 + 18);
    ctx.restore();
  }

  // QR 上方小提示（可選）
  ctx.save();
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = `600 18px ui-sans-serif, system-ui, -apple-system, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei"`;
  ctx.fillText("掃碼試算", slotX + qrSize, slotY - qrGap);
  ctx.restore();
}

function drawBackgroundFlex(ctx, size) {
  // 深黑 + 金色粒子 + 金屬拉絲
  ctx.save();
  ctx.fillStyle = "#07070a";
  ctx.fillRect(0, 0, size, size);

  const g = ctx.createRadialGradient(size * 0.35, size * 0.2, size * 0.05, size * 0.35, size * 0.2, size * 0.9);
  g.addColorStop(0, "rgba(212,175,55,0.22)");
  g.addColorStop(0.55, "rgba(212,175,55,0.06)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // 拉絲：多條水平淡線
  ctx.globalAlpha = 0.12;
  for (let y = 0; y < size; y += 2) {
    const a = (Math.sin(y * 0.07) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.03 + a * 0.04})`;
    ctx.fillRect(0, y, size, 1);
  }
  ctx.globalAlpha = 1;

  // 粒子：金色散點
  const count = Math.floor(size * 1.8);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.6;
    const a = 0.06 + Math.random() * 0.18;
    ctx.fillStyle = `rgba(212,175,55,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  drawNoise(ctx, 0, 0, size, size, 0.05, 24601);
  ctx.restore();
}

function drawBackgroundReality(ctx, size) {
  // 深灰 -> 警示橘漸層
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, "#1f2937");
  g.addColorStop(0.55, "#3f1d1b");
  g.addColorStop(1, "#ff4500");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  // 壓迫感：斜線
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#000";
  for (let x = -size; x < size * 2; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 14, 0);
    ctx.lineTo(x + size + 14, size);
    ctx.lineTo(x + size, size);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  drawNoise(ctx, 0, 0, size, size, 0.055, 9001);
}

function drawBackgroundComic(ctx, size) {
  // 紫 + 螢光綠色塊
  ctx.save();
  ctx.fillStyle = "#8A2BE2";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#00FF00";
  ctx.beginPath();
  ctx.moveTo(size * 0.08, size * 0.62);
  ctx.lineTo(size * 1.02, size * 0.42);
  ctx.lineTo(size * 1.02, size * 0.86);
  ctx.lineTo(size * 0.1, size * 1.02);
  ctx.closePath();
  ctx.fill();

  // 漫畫點點
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#000";
  const step = 22;
  for (let y = 20; y < size; y += step) {
    for (let x = 20; x < size; x += step) {
      const r = (Math.sin((x + y) * 0.02) + 1.2) * 2.2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBadge(ctx, { x, y, w, h, fill, stroke, r = 18 }) {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = stroke;
  ctx.stroke();
  ctx.restore();
}

function drawProgressBar(ctx, { x, y, w, h, pct, fill, bg, stroke }) {
  const p = clamp(pct, 0, 100) / 100;
  ctx.save();
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  const innerW = Math.max(h, w * p);
  roundRectPath(ctx, x, y, innerW, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function formatMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return String(n);
  return v.toLocaleString("zh-TW");
}

function normalizeData(data) {
  const d = { ...data };
  d.currentAge = Number(d.currentAge) || 0;
  d.retireAge = Number(d.retireAge) || 0;
  d.yearsLeft = Number(d.yearsLeft) || 0;
  d.passiveIncomeRate = Number(d.passiveIncomeRate) || 0;
  d.monthlySalary = Number(d.monthlySalary) || 0;
  return d;
}

/**
 * 生成分享圖（Canvas），不直接下載；可再用 downloadShareImage().
 * @param {ShareData} data
 * @param {"flex"|"reality"|"comic"} style
 * @param {Partial<ShareStyleOptions>=} options
 * @returns {ShareImageResult}
 */
export function generateShareImage(data, style, options = {}) {
  const d = normalizeData(data);
  const size = options.size ?? DEFAULTS.size;
  const padding = options.padding ?? DEFAULTS.padding;
  const siteName = options.siteName ?? DEFAULTS.siteName;
  const qrSize = DEFAULTS.qrSize;
  const qrGap = DEFAULTS.qrGap;
  const qrImage = options.qrImage ?? null;
  const qrLabel = options.qrLabel ?? "";

  const { canvas, ctx } = dprCanvas(size);

  // 背景
  if (style === SHARE_STYLES.flex) drawBackgroundFlex(ctx, size);
  else if (style === SHARE_STYLES.reality) drawBackgroundReality(ctx, size);
  else drawBackgroundComic(ctx, size);

  // 版面區（避開 QR）
  const contentW = size - padding * 2;
  const contentH = size - padding * 2;
  const qrBox = { x: size - padding - qrSize, y: size - padding - qrSize, w: qrSize, h: qrSize };
  const safeBottom = qrBox.y - qrGap - 10;

  const fontFamily = `ui-sans-serif, system-ui, -apple-system, "Noto Sans TC", "PingFang TC", "Microsoft JhengHei"`;

  if (style === SHARE_STYLES.flex) {
    const gold = "#D4AF37";
    // Title
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = gold;
    ctx.font = `800 34px ${fontFamily}`;
    ctx.fillText("成就解鎖", size / 2, padding - 6);
    ctx.restore();

    // 主視覺：登出倒數
    const mainText = `登出倒數：${Math.max(0, Math.round(d.yearsLeft))} 年`;
    const maxMainW = contentW - 40;
    const mainSize = fitFont(ctx, mainText, { maxWidth: maxMainW, maxSize: 118, minSize: 64, fontFamily, weight: 900 });
    withShadow(ctx, { color: "rgba(212,175,55,0.35)", blur: 18, dx: 0, dy: 6 }, () => {
      drawCenteredBlock(ctx, {
        x: padding,
        y: padding + 170,
        w: contentW,
        color: "#ffffff",
        font: `900 ${mainSize}px ${fontFamily}`,
        lines: [mainText],
        lineHeight: mainSize * 1.1,
      });
    });

    // 副標題：覆蓋率
    const subText = `被動收入覆蓋率：${clamp(d.passiveIncomeRate, 0, 999)}%`;
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `800 40px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(subText, size / 2, padding + 300);
    ctx.restore();

    // 嗆辣金句（置中）
    const quote = "不好意思，我要先退休了。";
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 54px ${fontFamily}`;
    withShadow(ctx, { color: "rgba(212,175,55,0.55)", blur: 18, dx: 0, dy: 6 }, () => {
      ctx.fillStyle = gold;
      ctx.fillText(quote, size / 2, padding + 440);
    });
    ctx.restore();

    // 小卡片（左下上方，避 QR）
    const cardX = padding;
    const cardY = safeBottom - 190;
    const cardW = size - padding * 2 - qrSize - 24;
    const cardH = 170;
    drawBadge(ctx, { x: cardX, y: cardY, w: cardW, h: cardH, fill: "rgba(255,255,255,0.06)", stroke: "rgba(212,175,55,0.35)", r: 20 });
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = `700 30px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`目前年齡：${d.currentAge} 歲`, cardX + 22, cardY + 22);
    ctx.fillText(`預計退休：${d.retireAge} 歲`, cardX + 22, cardY + 66);
    ctx.fillText(`月薪：${formatMoney(d.monthlySalary)}`, cardX + 22, cardY + 110);
    ctx.restore();
  }

  if (style === SHARE_STYLES.reality) {
    const ink = "rgba(0,0,0,0.88)";
    const deepRed = "#7f1d1d";

    // 主視覺：退休年齡
    const mainText = `預計退休年齡：${d.retireAge} 歲`;
    const mainSize = fitFont(ctx, mainText, { maxWidth: contentW - 40, maxSize: 94, minSize: 52, fontFamily, weight: 900 });
    withShadow(ctx, { color: "rgba(0,0,0,0.35)", blur: 18, dx: 0, dy: 10 }, () => {
      drawCenteredBlock(ctx, {
        x: padding,
        y: padding + 210,
        w: contentW,
        color: ink,
        font: `900 ${mainSize}px ${fontFamily}`,
        lines: [mainText],
        lineHeight: mainSize * 1.1,
      });
    });

    // 副標題：還得工作幾天
    const days = Math.max(0, Math.round(d.yearsLeft * 365));
    const subText = `你還得幫老闆工作 ${days} 天`;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = deepRed;
    ctx.font = `900 48px ${fontFamily}`;
    ctx.fillText(subText, size / 2, padding + 330);
    ctx.restore();

    // 嗆辣金句
    const quote = "你真的以為能準時下班嗎？";
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 56px ${fontFamily}`;
    withShadow(ctx, { color: "rgba(0,0,0,0.45)", blur: 24, dx: 0, dy: 10 }, () => {
      ctx.fillStyle = "#111827";
      ctx.fillText(quote, size / 2, padding + 470);
    });
    ctx.restore();

    // 角落警示貼紙（避 QR）
    const stickerW = 360;
    const stickerH = 86;
    const x = padding;
    const y = safeBottom - stickerH - 18;
    ctx.save();
    ctx.rotate(0);
    drawBadge(ctx, { x, y, w: stickerW, h: stickerH, fill: "rgba(0,0,0,0.28)", stroke: "rgba(0,0,0,0.55)", r: 18 });
    ctx.fillStyle = "rgba(0,0,0,0.78)";
    ctx.font = `900 34px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`覆蓋率：${clamp(d.passiveIncomeRate, 0, 999)}%`, x + 22, y + stickerH / 2);
    ctx.restore();
  }

  if (style === SHARE_STYLES.comic) {
    // 美式漫畫風：白字黑框
    const mainText = `月薪 ${formatMoney(d.monthlySalary)} 也能 ${d.retireAge} 歲退休？`;
    ctx.save();
    const mainSize = fitFont(ctx, mainText, { maxWidth: contentW - 40, maxSize: 86, minSize: 44, fontFamily, weight: 900 });
    ctx.font = `900 ${mainSize}px ${fontFamily}`;
    drawCenteredBlock(ctx, {
      x: padding,
      y: padding + 200,
      w: contentW,
      color: "#ffffff",
      stroke: "#111827",
      lineWidth: 12,
      font: `900 ${mainSize}px ${fontFamily}`,
      lines: wrapLines(ctx, mainText, contentW - 40),
      lineHeight: mainSize * 1.08,
    });
    ctx.restore();

    // 進度條文字
    const pct = clamp(d.passiveIncomeRate, 0, 100);
    const barX = padding;
    const barY = padding + 380;
    const barW = size - padding * 2;
    const barH = 44;
    drawProgressBar(ctx, { x: barX, y: barY, w: barW, h: barH, pct, fill: "#00FF00", bg: "rgba(255,255,255,0.18)", stroke: "#111827" });

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = `900 34px ${fontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 10;
    ctx.lineJoin = "round";
    const subText = `我的自由進度條：${pct}%`;
    ctx.strokeText(subText, size / 2, barY - 14);
    ctx.fillText(subText, size / 2, barY - 14);
    ctx.restore();

    // 嗆辣金句
    const quote = "重點不是賺多少，是怎麼滾！";
    ctx.save();
    ctx.font = `900 56px ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 14;
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText(quote, size / 2, padding + 520);
    ctx.fillText(quote, size / 2, padding + 520);
    ctx.restore();

    // 漫畫對話框（避 QR）
    const bubbleX = padding;
    const bubbleY = safeBottom - 210;
    const bubbleW = size - padding * 2 - qrSize - 24;
    const bubbleH = 188;
    drawBadge(ctx, { x: bubbleX, y: bubbleY, w: bubbleW, h: bubbleH, fill: "rgba(255,255,255,0.86)", stroke: "#111827", r: 26 });
    ctx.save();
    ctx.fillStyle = "#111827";
    ctx.font = `900 32px ${fontFamily}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(`目前：${d.currentAge} 歲`, bubbleX + 22, bubbleY + 22);
    ctx.fillText(`倒數：${Math.max(0, Math.round(d.yearsLeft))} 年`, bubbleX + 22, bubbleY + 68);
    ctx.fillText(`覆蓋：${clamp(d.passiveIncomeRate, 0, 999)}%`, bubbleX + 22, bubbleY + 114);
    ctx.restore();
  }

  // 底部固定元件：網站名 + QR slot
  drawQrSlot(ctx, { size, padding, siteName, qrSize, qrGap, qrImage, qrLabel });

  return {
    canvas,
    ctx,
    toDataURL: (type = "image/png", quality) => canvas.toDataURL(type, quality),
    toBlob: (type = "image/png", quality) =>
      new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type, quality);
      }),
  };
}

/**
 * 下載圖片（預設 PNG）
 * @param {HTMLCanvasElement} canvas
 * @param {string=} filename
 */
export function downloadShareImage(canvas, filename = "wealth-freedom-share.png") {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

