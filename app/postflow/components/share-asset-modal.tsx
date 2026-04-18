"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, ImagePlus, X } from "lucide-react";
import {
  SHARE_ASSET_PUBLIC,
  SHARE_IMAGE_FOLDER_ABS,
  type ShareAssetKind,
  markdownForSingleShareFile,
  publicUrlForShareFile,
  tryFileUrlFromWindowsPath,
} from "../share-assets";

const DH1 = "#0F172A";
const DH2 = "#1E293B";
const DH4 = "#64748B";
const DIV = "#E2E8F0";

type Slot = { file: string; label: string; alt: string };

export function ShareAssetModal({
  open,
  kind,
  onClose,
  onInsert,
}: {
  open: boolean;
  kind: ShareAssetKind | null;
  onClose: () => void;
  onInsert: (markdown: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<Record<string, string>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!open) {
      setPreviewOverride({});
      setCopied(false);
    }
  }, [open, kind]);

  const slots: Slot[] = useMemo(() => {
    if (!kind) return [];
    return [...SHARE_ASSET_PUBLIC[kind]];
  }, [kind]);

  const title = useMemo(() => {
    if (kind === "cover") return "封面預覽";
    if (kind === "screenshot") return "截圖預覽";
    if (kind === "result") return "結果預覽";
    return "";
  }, [kind]);

  const copyFolderPath = useCallback(() => {
    void navigator.clipboard.writeText(SHARE_IMAGE_FOLDER_ABS).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const tryOpenFolder = useCallback(() => {
    const u = tryFileUrlFromWindowsPath(SHARE_IMAGE_FOLDER_ABS);
    if (u) window.open(u, "_blank", "noopener,noreferrer");
  }, []);

  const onPickFile = useCallback((fileName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const prev = previewOverride[fileName];
    if (prev) URL.revokeObjectURL(prev);
    setPreviewOverride((p) => ({ ...p, [fileName]: URL.createObjectURL(f) }));
    e.target.value = "";
  }, [previewOverride]);

  const handleInsertOne = useCallback(
    (slot: Slot) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const md = markdownForSingleShareFile(slot.file, slot.alt, origin);
      onInsert(md);
      onClose();
    },
    [onInsert, onClose],
  );

  if (!open || !kind) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-asset-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl shadow-xl"
        style={{ background: "#FFFFFF", border: `1px solid ${DIV}` }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: DIV }}>
          <h2 id="share-asset-modal-title" className="text-[15px] font-bold" style={{ color: DH1 }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 transition-colors hover:bg-slate-100"
            aria-label="關閉"
          >
            <X className="h-5 w-5" style={{ color: DH4 }} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <p className="text-[12px] leading-relaxed" style={{ color: DH2 }}>
            對應檔名：<strong>封面 07</strong> · <strong>截圖 09／10</strong> · <strong>結果 11</strong>（放在網站{" "}
            <code className="rounded bg-slate-100 px-1 text-[11px]">public/postflow-share/</code> 或本機素材夾）。
          </p>

          {slots.map((slot) => {
            const src = previewOverride[slot.file] ?? publicUrlForShareFile(slot.file);
            return (
              <div key={slot.file} className="rounded-lg border p-3" style={{ borderColor: DIV }}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 text-[12px] font-semibold" style={{ color: DH1 }}>
                    {slot.label}（{slot.file}）
                  </span>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => {
                        fileRefs.current[slot.file] = el;
                      }}
                      onChange={(e) => onPickFile(slot.file, e)}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors hover:bg-slate-50"
                      style={{ background: "#FFFFFF", borderColor: DIV, color: DH2 }}
                      onClick={() => fileRefs.current[slot.file]?.click()}
                    >
                      <ImagePlus className="h-3.5 w-3.5" />
                      替換預覽
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-md border px-3 py-1 text-[11px] font-semibold transition-colors hover:bg-slate-50"
                      style={{ background: "#FFFFFF", borderColor: DIV, color: DH1 }}
                      onClick={() => handleInsertOne(slot)}
                    >
                      加入文章
                    </button>
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={slot.alt}
                  className="max-h-48 w-full rounded border object-contain"
                  style={{ borderColor: DIV, background: "#F8FAFC" }}
                />
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: DIV }}>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-slate-50"
              style={{ borderColor: DIV, color: DH2 }}
              onClick={copyFolderPath}
            >
              <FolderOpen className="h-4 w-4" />
              {copied ? "已複製路徑" : "複製素材資料夾路徑"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-colors hover:bg-slate-50"
              style={{ borderColor: DIV, color: DH4 }}
              onClick={tryOpenFolder}
            >
              嘗試開啟資料夾
            </button>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: DH4 }}>
            瀏覽器可能阻擋直接開啟本機資料夾；請優先使用「複製路徑」貼到檔案總管網址列。替換預覽僅本機預覽；發布請將圖檔覆蓋{" "}
            <code className="rounded bg-slate-100 px-0.5">public/postflow-share/</code> 對應檔名。
          </p>
        </div>

        <div className="flex justify-end border-t px-4 py-3" style={{ borderColor: DIV }}>
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-[13px] font-medium"
            style={{ color: DH4 }}
            onClick={onClose}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
