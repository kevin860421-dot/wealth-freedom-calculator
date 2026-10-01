"use client";

import { BLOG_OUTLETS, isBlogOutletKey } from "../outlet/platforms";

/** 只給本機 next dev 用。正式 build 不會 require 這支。 */
export function DevOutletFrame({ outlet }: { outlet: string | null }) {
  if (!outlet || !isBlogOutletKey(outlet)) return null;
  return (
    <iframe
      key={outlet}
      title="各大部落格隔離預覽"
      src={`/postflow/outlet/${outlet}`}
      className="min-h-0 w-full flex-1 border-0 bg-white"
    />
  );
}

export function DevOutletButtons({
  outlet,
  onOutlet,
}: {
  outlet: string | null;
  onOutlet: (key: string | null) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {BLOG_OUTLETS.map((item) => {
        const active = outlet === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onOutlet(active ? null : item.key)}
            className="rounded-md px-2.5 py-1 text-[12px] font-semibold"
            style={{
              color: active ? "#fff" : "#334155",
              background: active ? item.color : "transparent",
              border: `1px solid ${active ? item.color : "#D1D6D2"}`,
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
