"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./quick11-wizard-toast.module.css";

type Quick11WizardToastProps = {
  message: string | null;
};

export function Quick11WizardToast({ message }: Quick11WizardToastProps) {
  return (
    <AnimatePresence>
      {message ? (
        <div key={message} className={styles.wrap}>
          <motion.p
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className={styles.toast}
          >
            {message}
          </motion.p>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function useQuick11WizardToast(durationMs = 2800) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (text: string) => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setMessage(text);
      timerRef.current = window.setTimeout(() => {
        setMessage(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return { toastMessage: message, showToast };
}
