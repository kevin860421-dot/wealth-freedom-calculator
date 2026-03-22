"use client";

/** 產生 JPEG data URL；過大時降畫質，仍過大則放棄（避免塞爆記憶體／信件） */
const MAX_BASE64_CHARS = 720_000;

export async function captureElementToJpegDataUrl(el: HTMLElement): Promise<string | null> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (w < 4 || h < 4) return null;

    const maxEdge = 820;
    const dpr = typeof window !== "undefined" ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
    let scale = Math.min(dpr, maxEdge / Math.max(w, h, 1));

    const run = async (s: number, quality: number) => {
      const canvas = await html2canvas(el, {
        scale: s,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#0b1120",
        imageTimeout: 12000,
        foreignObjectRendering: false,
      });
      return canvas.toDataURL("image/jpeg", quality);
    };

    let dataUrl = await run(scale, 0.82);
    if (dataUrl.length > MAX_BASE64_CHARS) {
      dataUrl = await run(scale * 0.55, 0.72);
    }
    if (dataUrl.length > MAX_BASE64_CHARS) {
      dataUrl = await run(scale * 0.4, 0.65);
    }
    if (dataUrl.length > MAX_BASE64_CHARS) return null;
    return dataUrl;
  } catch {
    return null;
  }
}
