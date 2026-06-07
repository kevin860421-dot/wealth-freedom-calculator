"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState, type ReactNode } from "react";
import {
  copyQuick11ShareLink,
  openQuick11PlatformShare,
  type Quick11SharePlatform,
} from "./quick11-share-platform";
import panelStyles from "./quick11-share-desktop-panel.module.css";

type Quick11ShareDesktopPanelProps = {
  open: boolean;
  onClose: () => void;
};

function LineIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function FbIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function ThreadsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 192 192" fill="currentColor" aria-hidden>
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.741C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.013 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.07 0h-.113C68.882.195 47.292 9.643 32.788 28.08 19.882 44.485 13.224 67.315 13.001 95.932v.136c.223 28.617 6.881 51.447 19.787 67.854C47.292 182.357 68.882 191.805 96.957 192h.113c24.96-.173 42.554-6.708 57.048-21.189 18.963-18.945 18.392-42.692 12.142-57.27-4.484-10.454-13.033-18.944-24.723-24.553z" />
      <path d="M98.775 130.699c-8.02.46-15.52-1.693-20.516-6.223-3.642-3.252-5.556-7.566-5.733-12.81-.377-11.122 7.986-18.22 22.403-19.032 7.811-.45 15.09-.157 21.72.877.997 11.66-3.58 34.154-17.874 37.188z" />
    </svg>
  );
}

const PLATFORMS: { id: Quick11SharePlatform; label: string; className: string; icon: ReactNode }[] = [
  { id: "line", label: "LINE", className: panelStyles.platformLine, icon: <LineIcon /> },
  { id: "facebook", label: "Facebook", className: panelStyles.platformFb, icon: <FbIcon /> },
  { id: "threads", label: "Threads", className: panelStyles.platformThreads, icon: <ThreadsIcon /> },
];

/** 電腦版：對齊大計算機 footer「分享此頁」— LINE／FB／Threads 直開 */
export function Quick11ShareDesktopPanel({ open, onClose }: Quick11ShareDesktopPanelProps) {
  const [copied, setCopied] = useState(false);

  const onPlatform = useCallback((platform: Quick11SharePlatform) => {
    openQuick11PlatformShare(platform);
  }, []);

  const onCopy = useCallback(async () => {
    const ok = await copyQuick11ShareLink();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="quick11-share-panel-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={panelStyles.overlay}
          onClick={onClose}
        >
          <motion.div
            key="quick11-share-panel-card"
            role="dialog"
            aria-modal
            aria-labelledby="quick11-share-panel-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={panelStyles.card}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={panelStyles.head}>
              <span className={panelStyles.headIcon} aria-hidden>
                ↗
              </span>
              <div>
                <p id="quick11-share-panel-title" className={panelStyles.titleZh}>
                  分享此頁
                </p>
                <p className={panelStyles.titleEn}>SHARE</p>
              </div>
            </div>

            <button type="button" onClick={() => void onCopy()} className={panelStyles.copyBtn}>
              {copied ? "✓ 已複製" : "複製連結"}
            </button>

            <div className={panelStyles.platformRow}>
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPlatform(p.id)}
                  className={`${panelStyles.platformBtn} ${p.className}`}
                >
                  {p.icon}
                  <span>{p.label}</span>
                </button>
              ))}
            </div>

            <button type="button" onClick={onClose} className={panelStyles.cancelBtn}>
              取消
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
