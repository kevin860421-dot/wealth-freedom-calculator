"use client";

import { useCallback, useEffect, useState } from "react";
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

type Props = {
  /** 內嵌在父區塊右下角時使用，不使用 position:fixed 佔滿視窗 */
  embedded?: boolean;
};

export function PwaInstallCorner({ embedded = false }: Props) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
  }, []);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const runInstall = useCallback(async () => {
    if (!deferred) {
      setHelpOpen(true);
      return;
    }
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  }, [deferred]);

  const wrapClass = embedded ? styles.embeddedWrap : styles.fab;

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
    <div className={styles.fabRow}>
      <button type="button" className={`${styles.fabBtn} ${styles.fabMobile}`} onClick={runInstall}>
        <span className={styles.fabBtnIcon} aria-hidden>
          <IconPhoneApp width={26} height={26} />
        </span>
        <span className={styles.fabBtnTextCol}>
          <span className={styles.fabBtnTitle}>手機 App</span>
          <span className={styles.fabBtnSub}>加入主畫面 · 快速開啟</span>
        </span>
      </button>
      <button type="button" className={`${styles.fabBtn} ${styles.fabDesktop}`} onClick={runInstall}>
        <span className={styles.fabBtnIcon} aria-hidden>
          <IconDesktopApp width={26} height={26} />
        </span>
        <span className={styles.fabBtnTextCol}>
          <span className={styles.fabBtnTitle}>電腦 App</span>
          <span className={styles.fabBtnSub}>安裝為應用程式 · 獨立視窗</span>
        </span>
      </button>
    </div>
  );

  const embeddedFooter = (
    <div className={styles.embeddedFooter}>
      <p className={styles.footerHint}>
        <span aria-hidden>📱</span> 使用 App 可快速開啟，較不易被當一般分頁清掉。
      </p>
      <div className={styles.footerBtnRow}>
        <button type="button" className={`${styles.fabBtn} ${styles.fabMobile} ${styles.fabBtnEmbedded}`} onClick={runInstall}>
          <span className={styles.fabBtnIcon} aria-hidden>
            <IconPhoneApp width={22} height={22} />
          </span>
          <span className={styles.fabBtnTextCol}>
            <span className={styles.fabBtnTitle}>手機 App</span>
            <span className={styles.fabBtnSub}>加入主畫面</span>
          </span>
        </button>
        <button type="button" className={`${styles.fabBtn} ${styles.fabDesktop} ${styles.fabBtnEmbedded}`} onClick={runInstall}>
          <span className={styles.fabBtnIcon} aria-hidden>
            <IconDesktopApp width={22} height={22} />
          </span>
          <span className={styles.fabBtnTextCol}>
            <span className={styles.fabBtnTitle}>電腦 App</span>
            <span className={styles.fabBtnSub}>獨立視窗</span>
          </span>
        </button>
      </div>
      <button type="button" className={styles.linkHelpFooter} onClick={() => setHelpOpen(true)}>
        沒有出現安裝？查看手動步驟
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
    </>
  );
}
