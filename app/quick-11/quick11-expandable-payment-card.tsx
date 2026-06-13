"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import {
  formatPaymentMoney,
  paymentHeadlineFromSchedules,
  scheduleRowsForMethod,
} from "./quick11-payment-display";
import { Quick11MethodToggle } from "./quick11-method-toggle";
import { Quick11PaymentScheduleTable } from "./quick11-payment-schedule-table";
import { ShrinkFitCardAmount, ShrinkFitText } from "./quick11-shrink-fit";
import type { LoanMethod, PaymentRow } from "./logic";

const MODAL_CLASS = "left-0 right-0 mx-auto w-[calc(100%-1.5rem)] max-w-[420px]";

type Props = {
  title: string;
  amount: number;
  hint?: string;
  annuityRows: PaymentRow[];
  equalPrincipalRows: PaymentRow[];
  method: LoanMethod;
  tone: string;
  isLight?: boolean;
};

function Quick11PaymentScheduleModal(props: {
  open: boolean;
  onClose: () => void;
  annuityRows: PaymentRow[];
  equalPrincipalRows: PaymentRow[];
  method: LoanMethod;
  isLight?: boolean;
}) {
  const { open, onClose, annuityRows, equalPrincipalRows, method, isLight = false } = props;
  const [modalMethod, setModalMethod] = useState<LoanMethod>(method);

  useEffect(() => {
    if (open) setModalMethod(method);
  }, [open, method]);

  const modalHeadline = useMemo(
    () => paymentHeadlineFromSchedules(annuityRows, equalPrincipalRows, modalMethod),
    [annuityRows, equalPrincipalRows, modalMethod],
  );
  const modalRows = useMemo(
    () => scheduleRowsForMethod(annuityRows, equalPrincipalRows, modalMethod),
    [annuityRows, equalPrincipalRows, modalMethod],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.button
          key="payment-schedule-backdrop"
          type="button"
          aria-label="關閉每期明細"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/70"
          onClick={onClose}
        />
      ) : null}
      {open ? (
        <motion.section
          key="payment-schedule-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="q11-payment-schedule-title"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={`fixed bottom-0 z-[70] flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border shadow-[0_-8px_32px_rgba(0,0,0,0.2)] ${MODAL_CLASS} ${
            isLight ? "border-slate-200 bg-white" : "border-slate-700 bg-[#0b1220]"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-4 pt-3">
            <div className={`mx-auto mb-3 h-1 w-10 shrink-0 rounded-full ${isLight ? "bg-slate-300" : "bg-slate-600"}`} aria-hidden />

            <header className="mb-2 flex shrink-0 items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Quick11MethodToggle method={modalMethod} onChange={setModalMethod} isLight={isLight} compact />
                  <span className={`text-[11px] font-semibold ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    切換看另一套明細
                  </span>
                </div>
                <p className={`text-[12px] font-semibold tracking-[0.08em] ${isLight ? "text-sky-700" : "text-sky-300"}`}>
                  {modalHeadline.methodLabel} · 每期明細
                </p>
                <h2
                  id="q11-payment-schedule-title"
                  className={`mt-0.5 text-[16px] font-black leading-snug ${isLight ? "text-slate-900" : "text-slate-50"}`}
                >
                  {modalHeadline.title}
                </h2>
                <p className={`mt-1 font-mono text-[15px] font-black tabular-nums ${isLight ? "text-sky-800" : "text-sky-200"}`}>
                  {formatPaymentMoney(modalHeadline.amount)}
                </p>
                {modalHeadline.hint ? (
                  <p className={`mt-1 text-[12px] leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                    {modalHeadline.hint}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[13px] font-bold ${
                  isLight ? "border-slate-200 bg-slate-100 text-slate-900" : "border-slate-600 text-slate-200"
                }`}
              >
                關閉
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-auto">
              <Quick11PaymentScheduleTable
                rows={modalRows}
                method={modalMethod}
                isLight={isLight}
                compact={false}
                maxHeightClass="max-h-none"
              />
            </div>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

/** 首頁／結果頁：點擊開啟每期繳款彈窗 */
export function Quick11ExpandablePaymentCard(props: Props) {
  const { title, amount, hint, annuityRows, equalPrincipalRows, method, tone, isLight = false } = props;
  const value = formatPaymentMoney(amount);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        aria-haspopup="dialog"
        className={`group min-w-0 rounded-lg border p-2 text-left transition ${tone} flex h-full min-h-[94px] w-full flex-col hover:brightness-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-1">
            <ShrinkFitText
              minPx={10}
              maxPx={16}
              className={`font-bold tracking-[0.04em] ${isLight ? "text-slate-600" : "text-slate-300"}`}
            >
              {title}
            </ShrinkFitText>
            <ChevronRight
              className={`mt-0.5 h-4 w-4 shrink-0 ${isLight ? "text-slate-400 group-hover:text-sky-600" : "text-slate-500 group-hover:text-sky-300"}`}
              aria-hidden
            />
          </div>
          <div className={`mt-1 flex min-h-[30px] flex-1 items-center ${isLight ? "text-slate-900" : "text-slate-100"}`}>
            <ShrinkFitCardAmount animKey={`${title}-${value}`}>{value}</ShrinkFitCardAmount>
          </div>
          <p className={`mt-auto min-h-[2.35rem] pt-1.5 text-[11px] leading-snug ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            {hint ? `${hint} · 點開看每期` : "點開看每期繳多少"}
          </p>
        </div>
      </button>

      <Quick11PaymentScheduleModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        annuityRows={annuityRows}
        equalPrincipalRows={equalPrincipalRows}
        method={method}
        isLight={isLight}
      />
    </>
  );
}
