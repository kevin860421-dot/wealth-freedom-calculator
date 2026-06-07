"use client";

import { AnimatePresence, motion } from "framer-motion";
import styles from "./quick11-wizard-confirm.module.css";

type Quick11WizardConfirmProps = {
  open: boolean;
  title: string;
  body: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function Quick11WizardConfirm({
  open,
  title,
  body,
  cancelLabel = "返回",
  confirmLabel = "立即前往",
  onCancel,
  onConfirm,
}: Quick11WizardConfirmProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div key="confirm-overlay" className={styles.overlay}>
          <motion.button
            type="button"
            aria-label="返回"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.backdrop}
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal
            aria-labelledby="quick11-wizard-confirm-title"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={styles.card}
          >
            <p id="quick11-wizard-confirm-title" className={styles.title}>
              {title}
            </p>
            <p className={styles.body}>{body}</p>
            <div className={styles.actions}>
              <button type="button" onClick={onCancel} className={styles.cancelBtn}>
                {cancelLabel}
              </button>
              <button type="button" onClick={onConfirm} className={styles.confirmBtn}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
