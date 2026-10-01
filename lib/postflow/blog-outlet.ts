import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  isBlogOutletKey,
  type BlogOutletKey,
} from "@/app/postflow/outlet/platforms";

export type BlogOutletArticle = {
  file: string;
  title: string;
  body: string;
};

const ARTICLES_DIR = path.join(
  process.cwd(),
  "02_The Wealth Freedom Computer (Article)",
  "articles",
);

function safeFileName(file: string): string | null {
  if (!/^[\w.-]+\.md$/i.test(file)) return null;
  if (file.startsWith("_") || file.toLowerCase() === "readme.md") return null;
  return file;
}

function firstHeading(body: string, fallback: string): string {
  const line = body
    .split("\n")
    .map((row) => row.trim())
    .find((row) => row.startsWith("#"));
  if (!line) return fallback.trim() || "未命名";
  return line.replace(/^#+\s*/, "").trim() || fallback.trim() || "未命名";
}

async function readPlatformBody(file: string, platform: BlogOutletKey): Promise<BlogOutletArticle | null> {
  const safe = safeFileName(file);
  if (!safe) return null;
  const raw = await readFile(path.join(ARTICLES_DIR, safe), "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  let meta: { title?: unknown; platform_bodies?: unknown };
  try {
    meta = JSON.parse(match[1]) as { title?: unknown; platform_bodies?: unknown };
  } catch {
    return null;
  }
  const bodies = meta.platform_bodies;
  if (!bodies || typeof bodies !== "object") return null;
  const body = (bodies as Record<string, unknown>)[platform];
  if (typeof body !== "string" || !body.trim()) return null;
  const fallback = typeof meta.title === "string" ? meta.title : safe;
  return { file: safe, title: firstHeading(body, fallback), body };
}

export async function listBlogOutlet(platform: string): Promise<BlogOutletArticle[] | null> {
  if (!isBlogOutletKey(platform)) return null;
  let names: string[];
  try {
    names = await readdir(ARTICLES_DIR);
  } catch {
    return [];
  }
  const articles: BlogOutletArticle[] = [];
  for (const name of names.sort()) {
    const article = await readPlatformBody(name, platform);
    if (article) articles.push({ file: article.file, title: article.title, body: "" });
  }
  return articles;
}

export async function readBlogOutletArticle(
  platform: string,
  file: string,
): Promise<BlogOutletArticle | null> {
  if (!isBlogOutletKey(platform)) return null;
  const article = await readPlatformBody(file, platform);
  return article;
}
