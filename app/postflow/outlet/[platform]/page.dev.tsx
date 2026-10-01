import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogOutletLabel, isBlogOutletKey } from "../platforms";
import { listBlogOutlet, readBlogOutletArticle } from "@/lib/postflow/blog-outlet";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ platform: string }>;
  searchParams: Promise<{ file?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { platform } = await params;
  if (!isBlogOutletKey(platform)) return { robots: { index: false, follow: false } };
  return {
    title: `${blogOutletLabel(platform)}隔離預覽`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={key}>{bold[1]}</strong>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      const href = link[2];
      const external = /^https?:\/\//i.test(href);
      return external ? (
        <a key={key} href={href} target="_blank" rel="nofollow noopener noreferrer">
          {link[1]}
        </a>
      ) : (
        <span key={key}>{link[1]}</span>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

function OutletBody({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
        if (heading && !trimmed.includes("\n")) {
          const level = heading[1].length;
          const size = level === 1 ? "1.35rem" : level === 2 ? "1.12rem" : "1rem";
          return (
            <h2 key={index} style={{ margin: 0, fontSize: size, lineHeight: 1.45, fontWeight: 700 }}>
              {renderInline(heading[2], `h-${index}`)}
            </h2>
          );
        }
        if (trimmed.startsWith("> ")) {
          return (
            <blockquote
              key={index}
              style={{ margin: 0, paddingLeft: "0.8rem", borderLeft: "3px solid #cbd5e1", color: "#475569" }}
            >
              {renderInline(trimmed.replace(/^>\s?/gm, ""), `q-${index}`)}
            </blockquote>
          );
        }
        return (
          <p key={index} style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {renderInline(trimmed, `p-${index}`)}
          </p>
        );
      })}
    </div>
  );
}

export default async function BlogOutletPage({ params, searchParams }: PageProps) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { platform } = await params;
  if (!isBlogOutletKey(platform)) notFound();
  const query = await searchParams;
  const file = typeof query.file === "string" ? query.file : "";
  const articles = await listBlogOutlet(platform);
  if (!articles) notFound();
  const selected = file ? await readBlogOutletArticle(platform, file) : null;
  const label = blogOutletLabel(platform);

  return (
    <main
      style={{
        margin: 0,
        minHeight: "100%",
        background: "#f8fafc",
        color: "#0f172a",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "15px",
        lineHeight: 1.75,
      }}
    >
      <header style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
        <p style={{ margin: 0, fontSize: "11px", letterSpacing: "0.04em", color: "#64748b" }}>
          隔離預覽 · 不進公開部落格、列表、sitemap
        </p>
        <h1 style={{ margin: "4px 0 0", fontSize: "16px" }}>{label}</h1>
      </header>
      <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }}>
        <nav style={{ width: "220px", flexShrink: 0, borderRight: "1px solid #e2e8f0", background: "#fff" }}>
          {articles.length === 0 ? (
            <p style={{ padding: "12px", color: "#64748b" }}>這站還沒有可發的獨立稿。</p>
          ) : (
            articles.map((article) => {
              const active = article.file === file;
              return (
                <Link
                  key={article.file}
                  href={`/postflow/outlet/${platform}?file=${encodeURIComponent(article.file)}`}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    color: active ? "#0f172a" : "#334155",
                    background: active ? "#e0e7ff" : "transparent",
                    textDecoration: "none",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  {article.title}
                </Link>
              );
            })
          )}
        </nav>
        <article style={{ flex: 1, padding: "20px 22px 48px", maxWidth: "42rem" }}>
          {selected ? (
            <>
              <h2 style={{ margin: "0 0 16px", fontSize: "1.45rem", lineHeight: 1.35 }}>{selected.title}</h2>
              <OutletBody text={selected.body.replace(/^#[^\n]*\n+/, "")} />
            </>
          ) : (
            <p style={{ color: "#64748b" }}>左邊選一篇。這裡只顯示要貼到{label}的正文，不會改到左邊的母版。</p>
          )}
        </article>
      </div>
    </main>
  );
}
