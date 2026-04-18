/**
 * 整理從 Blogger「檢視網頁原始碼」或編輯器複製的 HTML，方便當成母文內容儲存。
 * - 去掉 <style>（常夾帶大量主題 CSS）
 * - 用 DOMParser 解析整頁時取 <body> innerHTML；片段則維持可解析部分
 * - 去掉 <script>
 */
export function normalizeBloggerPaste(raw: string): string {
  let s = raw.trim();
  if (!s) return "";
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");

  try {
    const doc = new DOMParser().parseFromString(s, "text/html");
    doc.querySelectorAll("script").forEach((el) => el.remove());
    const body = doc.body;
    if (body) {
      const inner = body.innerHTML.trim();
      if (inner) return inner;
    }
  } catch {
    /* 保留原字串 */
  }
  return s.trim();
}
