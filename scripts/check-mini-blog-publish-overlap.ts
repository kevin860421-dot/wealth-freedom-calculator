/**
 * 檢查 mini-blog 全部專文 publishAtIso 是否重複（同日可、同一時間戳不可）。
 * 執行：npx tsx --tsconfig tsconfig.json scripts/check-mini-blog-publish-overlap.ts
 */
import { QUICK1_EXCLUSIVE_POSTS } from "../app/mini-blog/posts/quick1-exclusive";

function main() {
  const byTime = new Map<string, string[]>();
  for (const p of QUICK1_EXCLUSIVE_POSTS) {
    const t = p.publishAtIso;
    const list = byTime.get(t) ?? [];
    list.push(p.slug);
    byTime.set(t, list);
  }

  const dupes = [...byTime.entries()].filter(([, slugs]) => slugs.length > 1);
  if (dupes.length === 0) {
    console.log(`check-mini-blog-publish-overlap: OK（${QUICK1_EXCLUSIVE_POSTS.length} 篇，無相同 publishAtIso）`);
    return;
  }

  console.error("check-mini-blog-publish-overlap: 發現重複時間戳：");
  for (const [iso, slugs] of dupes.sort(([a], [b]) => a.localeCompare(b))) {
    console.error(`  ${iso}`);
    for (const s of slugs) console.error(`    - ${s}`);
  }
  process.exit(1);
}

main();
