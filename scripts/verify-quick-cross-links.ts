import { pickQuickCrossLinks, QUICK_CALCULATOR_IDS, QUICK_CROSS_LINK_RELATED } from "../lib/quick-cross-links";

let ok = true;

for (const id of QUICK_CALCULATOR_IDS) {
  const links = pickQuickCrossLinks(id, 3);
  const related = QUICK_CROSS_LINK_RELATED[id];

  if (!related || related.length < 3) {
    console.error(`quick-${id}: QUICK_CROSS_LINK_RELATED should list at least 3 ids`);
    ok = false;
  }
  if (links.length !== 3) {
    console.error(`quick-${id}: expected 3 links, got ${links.length}`);
    ok = false;
  }
  if (links.some((l) => l.id === id)) {
    console.error(`quick-${id}: must not include self`);
    ok = false;
  }
  if (related && !related.every((r) => r === id || links.some((l) => l.id === r))) {
    console.error(`quick-${id}: pick result should include configured related ids`, related, links.map((l) => l.id));
    ok = false;
  }
}

console.log("quick-11 related:", pickQuickCrossLinks(11, 3).map((l) => l.title).join(" | "));
console.log("quick-1 related:", pickQuickCrossLinks(1, 3).map((l) => l.title).join(" | "));
console.log(ok ? "verify-quick-cross-links: OK" : "verify-quick-cross-links: FAILED");
process.exit(ok ? 0 : 1);
