"use client";

import { useEffect, useRef, useState } from "react";
import { useStats } from "../stats-provider";

interface ShareCardCanvasProps {
  fireEtaYears: number | null;
  monthlyContributionNum: number;
}

const CALC_URL = "https://wealth-freedom-calculator.vercel.app/";

function calcPercentile(years: number | null): number {
  if (years === null || years > 40) return 18;
  if (years <= 8)  return 95;
  if (years <= 12) return 88;
  if (years <= 15) return 82;
  if (years <= 18) return 75;
  if (years <= 22) return 65;
  if (years <= 27) return 52;
  if (years <= 32) return 40;
  return 28;
}

function fmtCount(n: number): string {
  if (n >= 10000) return `${Math.floor(n / 1000)}千+`;
  if (n >= 1000)  return `${(n / 1000).toFixed(1)}k+`;
  if (n >= 500)   return "幾百";
  if (n >= 200)   return `${Math.floor(n / 100)}百+`;
  if (n >= 100)   return "百餘";
  return `${n}`;
}

async function buildShareCanvas(
  years: number | null,
  monthlyFmt: number,
  percentile: number,
  peopleStr: string,
): Promise<HTMLCanvasElement> {
  const W = 1024, H = 682;
  const canvas = document.createElement("canvas");
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bgImg = await loadImage("/share-card-bg.jpg");
  ctx.drawImage(bgImg, 0, 0, W, H);

  let qrImg: HTMLImageElement | null = null;
  try {
    const { default: QRCode } = await import("qrcode");
    const qrDataUrl = await QRCode.toDataURL(CALC_URL, {
      margin: 1, scale: 5, errorCorrectionLevel: "M",
      color: { dark: "#1a4d1e", light: "#ffffff" },
    });
    qrImg = await loadImage(qrDataUrl);
  } catch { /* ignore */ }

  // 圓圈
  const CX = 490, CY = 268, R = 136;
  ctx.save();
  ctx.beginPath();
  ctx.arc(CX, CY, R, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.strokeStyle = "#1a4d1e"; ctx.lineWidth = 10; ctx.stroke();
  ctx.restore();

  if (years !== null) {
    ctx.save();
    ctx.fillStyle = "#1a4d1e";
    ctx.textBaseline = "alphabetic";
    const ys = String(years);
    if (ys.length === 1) {
      ctx.font = `bold 138px Arial, sans-serif`; ctx.textAlign = "right";
      ctx.fillText(ys, CX + 18, CY + 55);
      ctx.font = `bold 58px Arial, sans-serif`; ctx.textAlign = "left";
      ctx.fillText("年", CX + 24, CY + 60);
    } else {
      ctx.font = `bold 108px Arial, sans-serif`; ctx.textAlign = "right";
      ctx.fillText(ys, CX + 20, CY + 44);
      ctx.font = `bold 48px Arial, sans-serif`; ctx.textAlign = "left";
      ctx.fillText("年", CX + 24, CY + 55);
    }
    ctx.restore();
  }

  // QR Code 區塊
  const QX = 30, QY = 458, QW = 140, QH = 145;
  roundRectFill(ctx, QX - 4, QY - 4, QW + 8, QH + 8, 10, "#e8f5e9");
  if (qrImg) ctx.drawImage(qrImg, QX, QY, QW, QH);
  ctx.save();
  ctx.fillStyle = "#1a4d1e"; ctx.textAlign = "center";
  ctx.font = `bold 15px Arial, sans-serif`;
  ctx.fillText("掃描 QR Code", QX + QW / 2, QY + QH + 20);
  ctx.fillText("進入計算", QX + QW / 2, QY + QH + 38);
  ctx.restore();

  // 底部右側文案
  const TX = 195, TW = 515;
  roundRectFill(ctx, TX - 8, 540, TW + 8, 148, 8, "rgba(210,242,210,0.97)");
  ctx.save();
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#1a4d1e";
  ctx.font = `bold 20px Arial, sans-serif`;
  ctx.fillText("我以為財富自由離我很遠，", TX + 4, 563);
  ctx.font = `18px Arial, sans-serif`;
  ctx.fillText("直到我寫了這個計算機...", TX + 4, 590);
  ctx.font = `16px Arial, sans-serif`; ctx.fillStyle = "#2d6a36";
  ctx.fillText("省的不只是錢，是『自由的時間』！", TX + 4, 614);
  ctx.font = `bold 22px Arial, sans-serif`; ctx.fillStyle = "#1a4d1e";
  ctx.fillText(`已有 ${peopleStr} 人算出結果了，你呢？`, TX + 4, 642);
  ctx.font = `bold 19px Arial, sans-serif`; ctx.fillStyle = "#0d5c20";
  ctx.fillText("你離退休還有多久？👆 掃碼試算", TX + 4, 667);
  ctx.restore();

  void percentile; void monthlyFmt;
  return canvas;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload  = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function roundRectFill(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number, color: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
}

// ── Platform icons ────────────────────────────────────────

function LineIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
    </svg>
  );
}
function FbIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
function IgIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}
function ThreadsIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 192 192" fill="currentColor">
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.741C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.643 32.788 28.08 19.882 44.485 13.224 67.315 13.001 95.932v.136c.223 28.617 6.881 51.447 19.787 67.854C47.292 182.357 68.882 191.805 96.957 192h.113c24.96-.173 42.554-6.708 57.048-21.189 18.963-18.945 18.392-42.692 12.142-57.27-4.484-10.454-13.033-18.944-24.723-24.553z"/>
      <path d="M98.775 130.699c-8.02.46-15.52-1.693-20.516-6.223-3.642-3.252-5.556-7.566-5.733-12.81-.377-11.122 7.986-18.22 22.403-19.032 7.811-.45 15.09-.157 21.72.877.997 11.66-3.58 34.154-17.874 37.188z"/>
    </svg>
  );
}

// ── Toast ─────────────────────────────────────────────────

type Toast = { msg: string; sub?: string };

function ToastBar({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)",
      background: "rgba(26,77,30,0.96)", color: "#fff",
      padding: "12px 22px", borderRadius: 12,
      boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      zIndex: 9999, textAlign: "center",
      animation: "fadeInUp 0.25s ease",
      fontSize: 14, fontWeight: 600,
      maxWidth: 340, lineHeight: 1.5,
    }}>
      {toast.msg}
      {toast.sub && (
        <div style={{ fontSize: 12, fontWeight: 400, marginTop: 4, opacity: 0.85 }}>
          {toast.sub}
        </div>
      )}
      <style>{`
        @keyframes fadeInUp {
          from { opacity:0; transform:translateX(-50%) translateY(12px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}


// ── Main component ────────────────────────────────────────

type Platform = "line" | "facebook" | "instagram" | "threads";

export function ShareCardCanvas({ fireEtaYears, monthlyContributionNum }: ShareCardCanvasProps) {
  const { stats } = useStats();
  const offscreen  = useRef<HTMLCanvasElement | null>(null);
  const [cardReady, setCardReady] = useState(false);
  const [toast, setToast]         = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const years      = fireEtaYears !== null ? Math.ceil(fireEtaYears) : null;
  const percentile = calcPercentile(years);
  const monthlyFmt = Math.round(monthlyContributionNum / 100) * 100;
  const peopleStr  = fmtCount(Math.max(stats.totalEngagement, stats.totalPageViews));

  useEffect(() => {
    setCardReady(false);
    buildShareCanvas(years, monthlyFmt, percentile, peopleStr)
      .then(c => { offscreen.current = c; setCardReady(true); })
      .catch(() => setCardReady(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years, monthlyFmt, percentile, peopleStr]);

  const showToast = (msg: string, sub?: string, ms = 3500) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, sub });
    toastTimer.current = setTimeout(() => setToast(null), ms);
  };

  const shareText = years !== null
    ? `我算出財富自由只需 ${years} 年！來試算你的退休時間 👇\n${CALC_URL}`
    : `快來試算你的財富自由還需要多久 👇\n${CALC_URL}`;

  /** 取得離屏 canvas 的 PNG Blob */
  const getBlob = (): Promise<Blob | null> =>
    new Promise(res => {
      const c = offscreen.current;
      if (!c) return res(null);
      c.toBlob(b => res(b), "image/png", 0.95);
    });

  /** 下載圖片到本機 */
  const downloadImage = (blob: Blob) => {
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `財富自由-${years ?? "試算"}年.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleShare = async (platform: Platform) => {
    if (!cardReady) return;
    const blob = await getBlob();

    switch (platform) {
      case "line": {
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(CALC_URL)}&text=${encodeURIComponent(shareText)}`,
          "_blank", "noopener",
        );
        break;
      }
      case "facebook": {
        // FB Sharer：自動顯示頁面 OG 預覽（標題＋描述＋圖），並有「新增訊息」欄
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(CALC_URL)}`,
          "_blank", "noopener",
        );
        try {
          await navigator.clipboard.writeText(shareText);
          showToast("🔗 FB 分享頁已開啟", "文字已複製，貼到「新增訊息」欄即可");
        } catch {
          showToast("🔗 FB 分享頁已開啟");
        }
        break;
      }
      case "instagram": {
        window.open("https://www.instagram.com/create/style/", "_blank", "noopener");
        showToast("📸 IG 已開啟", "如需分享圖，請按右側「下載圖片」", 4000);
        break;
      }
      case "threads": {
        window.open(
          `https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`,
          "_blank", "noopener",
        );
        break;
      }
    }
  };

  type BtnDef = {
    id: Platform; label: string; icon: React.ReactNode;
    bg: string; fg: string;
  };

  const buttons: BtnDef[] = [
    { id: "line",      label: "LINE",      icon: <LineIcon />,    bg: "#06C755", fg: "#fff" },
    { id: "facebook",  label: "Facebook",  icon: <FbIcon />,      bg: "#1877F2", fg: "#fff" },
    { id: "instagram", label: "Instagram", icon: <IgIcon />,
      bg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)", fg: "#fff" },
    { id: "threads",   label: "Threads",   icon: <ThreadsIcon />, bg: "#101010", fg: "#fff" },
  ];


  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", textAlign: "center" }}>
          📣 分享你的財富自由計算結果
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {buttons.map(btn => (
            <button
              key={btn.id}
              onClick={() => void handleShare(btn.id)}
              disabled={!cardReady}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 7, padding: "13px 20px",
                background: btn.bg, color: btn.fg,
                border: "none", borderRadius: 14,
                cursor: cardReady ? "pointer" : "not-allowed",
                opacity: cardReady ? 1 : 0.5,
                minWidth: 90, fontSize: 13, fontWeight: 600,
                boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseEnter={e => {
                if (!cardReady) return;
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "translateY(-2px) scale(1.05)";
                el.style.boxShadow = "0 6px 18px rgba(0,0,0,0.35)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = "";
                el.style.boxShadow = "0 2px 10px rgba(0,0,0,0.25)";
              }}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {!cardReady && (
          <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>分享圖準備中…</p>
        )}


      </div>

      <ToastBar toast={toast} />
    </>
  );
}
