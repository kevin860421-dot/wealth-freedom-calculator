"use client";

import { useEffect, useState } from "react";
import { OPEN_WATCHLIST_MODAL_EVENT } from "../../lib/watchlist-modal-events";
import { PwaInstallCorner } from "./pwa-install-corner";
import { WatchlistLocalHint } from "./watchlist-local-hint";
import { WatchlistNotesModal } from "./watchlist-notes-modal";
import styles from "./home-footer-watchlist-section.module.css";

export function HomeFooterWatchlistSection() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_WATCHLIST_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WATCHLIST_MODAL_EVENT, onOpen);
  }, []);

  return (
    <>
      <section className={styles.section} aria-labelledby="watchlist-teaser-title">
        <div className={styles.card}>
          <WatchlistLocalHint variant="footer" titleId="watchlist-teaser-title" />
          <div className={styles.ctaWrap}>
            <button type="button" className={styles.cta} onClick={() => setOpen(true)}>
              <span className={styles.ctaIcon} aria-hidden>
                ➕
              </span>
              <span>新增自選股</span>
            </button>
          </div>

          <div className={styles.appStrip}>
            <PwaInstallCorner embedded />
          </div>
        </div>
      </section>
      <WatchlistNotesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
