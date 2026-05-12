/** 產出 50 筆 +08 發布時間：5/14 起、間隔 2～3 日、避開常見連假區間 */
const EXCLUDE = new Set([
  "2026-06-19",
  "2026-06-20",
  "2026-06-21",
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",
  "2026-09-28",
  "2026-10-09",
  "2026-10-10",
  "2026-10-11",
  "2026-10-24",
  "2026-10-25",
  "2026-10-26",
  "2026-12-25",
  "2026-12-26",
  "2026-12-27",
]);

function taipeiYmd(ms) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** 台北日曆日 +1（以 UTC noon 錨定避免 DST） */
function addTaipeiDays(ms, days) {
  const d = new Date(ms + days * 86400000);
  return d.getTime();
}

let t = Date.parse("2026-05-14T12:00:00+08:00");
const out = [];
const pad = (n) => String(n).padStart(2, "0");

for (let i = 0; i < 50; i++) {
  while (EXCLUDE.has(taipeiYmd(t))) {
    t = addTaipeiDays(t, 1);
  }
  const ymd = taipeiYmd(t).split("-");
  const [y, mo, da] = ymd;
  const h = i % 3 === 0 ? 20 : 9;
  const m = i % 2 === 0 ? 0 : 30;
  out.push(`${y}-${mo}-${da}T${pad(h)}:${pad(m)}:00+08:00`);
  const step = 2 + (i % 2);
  t = addTaipeiDays(t, step);
}

console.log(JSON.stringify(out, null, 2));
console.error("count", out.length);
