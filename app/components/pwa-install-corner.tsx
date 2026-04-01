"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconDesktopApp, IconPhoneApp } from "./pwa-install-icons";
import styles from "./pwa-install-corner.module.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Android/i.test(ua) || /iPad|iPhone|iPod/.test(ua);
}

/** 無法觸發系統安裝對話框時，依裝置顯示一步驟提示（不開彈窗） */
function getManualInstallHint(kind: "mobile" | "desktop"): string {
  if (typeof navigator === "undefined") {
    return kind === "mobile"
      ? "請用瀏覽器選單將本網站加入主畫面。"
      : "請用瀏覽器選單將本網站安裝為應用程式。";
  }
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/i.test(ua);
  if (kind === "mobile") {
    if (isIOS) return "請點 Safari「分享」→「加入主畫面」，即可從主畫面開啟（像 App）。";
    if (isAndroid) return "請點 Chrome「⋮」選單 →「安裝應用程式」或「加入主畫面」。";
    return "請點瀏覽器選單 →「加入主畫面」或「安裝應用程式」。";
  }
  return "請點網址列右側「安裝」圖示，或選單 →「應用程式」→「安裝此網站」。";
}

type Props = {
  /** 內嵌在父區塊右下角時使用，不使用 position:fixed 佔滿視窗 */
  embedded?: boolean;
};

export function PwaInstallCorner({ embedded = false }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [mobileUa, setMobileUa] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);
  const [mobileShareOpen, setMobileShareOpen] = useState(false);
  const [mobileShareHost, setMobileShareHost] = useState<string>("");
  const [mobileShareQr, setMobileShareQr] = useState<string | null>(null);
  const [mobileShareCopyState, setMobileShareCopyState] = useState<"idle" | "ok" | "fail">("idle");

  useEffect(() => {
    setInstalled(isStandalone());
    // 避免 SSR/CSR HTML 不一致：UA 判斷只在 client 端設定狀態
    setMobileUa(isMobileUserAgent());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.host;
    // 本機開發時避免預設成 localhost，直接給部署站，方便手機掃碼安裝。
    const defaultDeployedHost = "wealth-freedom-calculator.vercel.app";
    const isLocal =
      h === "localhost" ||
      h.startsWith("localhost:") ||
      h === "127.0.0.1" ||
      h.startsWith("127.0.0.1:") ||
      h === "[::1]" ||
      h.startsWith("[::1]:");
    setMobileShareHost(isLocal ? defaultDeployedHost : h);
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    if (!fallbackHint) return;
    const t = window.setTimeout(() => setFallbackHint(null), 14000);
    return () => window.clearTimeout(t);
  }, [fallbackHint]);

  /** 優先叫出瀏覽器內建「安裝」對話框；若尚無法觸發，改顯示內聯一步驟（不開說明彈窗） */
  const triggerInstall = useCallback(
    async (kind: "mobile" | "desktop") => {
      // 桌機上「手機 App」：提供可在手機開啟的網址（複製/QR），不是在桌機觸發安裝。
      if (kind === "mobile" && !isMobileUserAgent()) {
        setMobileShareOpen(true);
        setMobileShareCopyState("idle");
        return;
      }
      if (deferred) {
        try {
          await deferred.prompt();
          await deferred.userChoice;
        } finally {
          setDeferred(null);
        }
        setFallbackHint(null);
        return;
      }
      // iOS Safari 不會出現 beforeinstallprompt：改直接開手動步驟，避免提示一閃而過看不到
      if (kind === "mobile" && typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
        setHelpOpen(true);
        setFallbackHint(null);
        return;
      }
      setFallbackHint(getManualInstallHint(kind));
    },
    [deferred],
  );

  const wrapClass = embedded ? styles.embeddedWrap : styles.fab;

  const mobileInstallUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const base = new URL(window.location.href);
    base.searchParams.delete("mobile");
    base.hash = "";

    const raw = mobileShareHost.trim();
    if (!raw) return base.toString();

    // 允許使用者輸入：
    // - host（例：wealth-freedom-calculator.vercel.app）
    // - host:port（例：192.168.6.41:3000）
    // - 完整 URL（例：https://wealth-freedom-calculator.vercel.app/）
    let u: URL;
    if (/^https?:\/\//i.test(raw)) {
      u = new URL(raw);
      u.pathname = base.pathname;
      u.search = base.search;
      u.hash = "";
    } else {
      u = new URL(base.toString());
      u.host = raw;
    }

    // 部署站（Vercel/Netlify）一律用 https，且不要帶 dev port。
    const deployed =
      u.hostname.endsWith(".vercel.app") ||
      u.hostname.endsWith(".netlify.app") ||
      u.hostname === "wealth-freedom-calculator.vercel.app";
    if (deployed) {
      u.protocol = "https:";
      u.port = "";
    }

    return u.toString();
  }, [mobileShareHost]);

  useEffect(() => {
    if (!mobileShareOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const { default: QRCode } = await import("qrcode");
        const dataUrl = await QRCode.toDataURL(mobileInstallUrl, {
          margin: 1,
          scale: 6,
          errorCorrectionLevel: "M",
          color: { dark: "#0f172a", light: "#ffffff" },
        });
        if (!cancelled) setMobileShareQr(dataUrl);
      } catch {
        if (!cancelled) setMobileShareQr(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mobileShareOpen, mobileInstallUrl]);

  const copyMobileUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(mobileInstallUrl);
      setMobileShareCopyState("ok");
    } catch {
      setMobileShareCopyState("fail");
    }
    window.setTimeout(() => setMobileShareCopyState("idle"), 2400);
  }, [mobileInstallUrl]);

  if (installed) {
    return (
      <div className={wrapClass} role="status">
        <p className={embedded ? styles.installedPlain : styles.installedBadge}>已安裝 App 模式</p>
      </div>
    );
  }

  const lead = (
    <p className={styles.fabLead}>
      <strong>一般網頁分頁</strong>若清除網站資料，試算與自選股資料可能不見；想有<strong>桌面／主畫面捷徑</strong>、像 App
      一樣開啟，請安裝應用程式。
    </p>
  );

  const buttonRow = (
    <>
      <div className={styles.fabRow}>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabMobile}`}
          onClick={() => void triggerInstall("mobile")}
        >
          <span className={styles.fabBtnIcon} aria-hidden>
            <IconPhoneApp width={26} height={26} />
          </span>
          <span className={styles.fabBtnTextCol}>
            <span className={styles.fabBtnTitle}>手機 App</span>
            <span className={styles.fabBtnSub} />
          </span>
        </button>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabDesktop}`}
          onClick={() => void triggerInstall("desktop")}
        >
          <span className={styles.fabBtnIcon} aria-hidden>
            <IconDesktopApp width={26} height={26} />
          </span>
          <span className={styles.fabBtnTextCol}>
            <span className={styles.fabBtnTitle}>電腦 App</span>
            <span className={styles.fabBtnSub} />
          </span>
        </button>
      </div>
      {fallbackHint ? (
        <p className={styles.inlineFallback} role="status" aria-live="polite">
          {fallbackHint}
        </p>
      ) : null}
    </>
  );

  const embeddedFooter = (
    <div className={styles.embeddedFooter}>
      <div className={styles.footerBtnRow}>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabMobile} ${styles.fabBtnEmbedded}`}
          onClick={() => void triggerInstall("mobile")}
        >
          <span className={styles.fabBtnIcon} aria-hidden>
            <IconPhoneApp width={22} height={22} />
          </span>
          <span className={styles.fabBtnTextCol}>
            <span className={styles.fabBtnTitle}>加入桌面/主畫面</span>
            <span className={styles.fabBtnSub} />
          </span>
        </button>
        <button
          type="button"
          className={`${styles.fabBtn} ${styles.fabDesktop} ${styles.fabBtnEmbedded}`}
          onClick={() => void triggerInstall("desktop")}
        >
          <span className={styles.fabBtnIcon} aria-hidden>
            <IconDesktopApp width={22} height={22} />
          </span>
          <span className={styles.fabBtnTextCol}>
            <span className={styles.fabBtnTitle}>電腦 App</span>
            <span className={styles.fabBtnSub} />
          </span>
        </button>
      </div>
      {fallbackHint ? (
        <p className={styles.inlineFallback} role="status" aria-live="polite">
          {fallbackHint}
        </p>
      ) : null}
      <button type="button" className={styles.linkHelpFooter} onClick={() => setHelpOpen(true)}>
        沒有出現安裝？查看完整手動步驟
      </button>
    </div>
  );

  return (
    <>
      <div className={wrapClass} aria-label="安裝應用程式">
        {embedded ? (
          embeddedFooter
        ) : (
          <div className={styles.fabCard}>
            {lead}
            {buttonRow}
            <button type="button" className={styles.linkHelp} onClick={() => setHelpOpen(true)}>
              沒有出現安裝？查看手動步驟
            </button>
          </div>
        )}
      </div>

      {helpOpen ? (
        <div className={styles.helpOverlay} role="presentation" onClick={() => setHelpOpen(false)}>
          <div className={styles.helpDialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className={styles.helpHead}>
              <h2 className={styles.helpTitle}>手動安裝應用程式</h2>
              <button type="button" className={styles.helpClose} onClick={() => setHelpOpen(false)} aria-label="關閉">
                ✕
              </button>
            </div>
            <ul className={styles.helpList}>
              <li>
                <strong>Chrome / Edge（電腦）</strong>：網址列右側「安裝」圖示，或選單 →「應用程式」→「安裝此網站」。
              </li>
              <li>
                <strong>Chrome（Android）</strong>：選單（⋮）→「安裝應用程式」或「加入主畫面」。
              </li>
              <li>
                <strong>Safari（iPhone）</strong>：分享鈕 →「加入主畫面」。
              </li>
            </ul>
            <p className={styles.helpNote}>
              試算與自選股資料會存在這台裝置；若清除瀏覽器的網站資料會一併刪除。從主畫面或桌面圖示開啟，較不會被當成一般分頁清掉。
            </p>
            <button type="button" className={styles.helpOk} onClick={() => setHelpOpen(false)}>
              知道了
            </button>
          </div>
        </div>
      ) : null}

      {mobileShareOpen ? (
        <div className={styles.helpOverlay} role="presentation" onClick={() => setMobileShareOpen(false)}>
          <div className={styles.shareDialog} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className={styles.helpHead}>
              <h2 className={styles.helpTitle}>手機安裝 App</h2>
              <button type="button" className={styles.helpClose} onClick={() => setMobileShareOpen(false)} aria-label="關閉">
                ✕
              </button>
            </div>
            <p className={styles.shareLead}>
              用手機掃描或開啟下方網址，接著用瀏覽器「加入主畫面 / 安裝應用程式」。資料會儲存在手機本機（同現在的試算與自選股）。
            </p>
            <div className={styles.shareGrid}>
              <div className={styles.qrWrap} aria-label="QR code">
                {mobileShareQr ? <img src={mobileShareQr} className={styles.qrImg} alt="手機開啟網址 QR code" /> : <div className={styles.qrFallback}>QR 產生中…</div>}
              </div>
              <div className={styles.shareRight}>
                <label className={styles.shareLabel}>
                  手機要開啟的網址（可改主機）
                  <input
                    className={styles.shareHost}
                    value={mobileShareHost}
                    onChange={(e) => setMobileShareHost(e.target.value)}
                    placeholder="例：192.168.10.41:3000"
                    inputMode="url"
                  />
                </label>
                <div className={styles.shareUrlBox}>
                  <div className={styles.shareUrlText}>{mobileInstallUrl}</div>
                  <button type="button" className={styles.shareCopyBtn} onClick={() => void copyMobileUrl()}>
                    {mobileShareCopyState === "ok" ? "已複製" : mobileShareCopyState === "fail" ? "複製失敗" : "複製連結"}
                  </button>
                </div>
                <p className={styles.shareNote}>
                  若你現在網址是 <strong>localhost</strong>，手機無法直接連。請把上方主機改成同網路下的電腦 IP（例如終端機顯示的 Network 位址）。
                </p>
              </div>
            </div>
            <button type="button" className={styles.helpOk} onClick={() => setMobileShareOpen(false)}>
              知道了
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
