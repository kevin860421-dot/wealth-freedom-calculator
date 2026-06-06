import { QuickCalculator11Content } from "./QuickCalculator11Content";
import { parseQuick11PresetFromSearchParams } from "./embed-preset";

type Quick11SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Quick11SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const sp = {
    get(key: string) {
      const v = params[key];
      return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
    },
  };
  const initialEmbedPreset = parseQuick11PresetFromSearchParams(sp);
  const initialWizardOpen = sp.get("wizard") === "1";

  return <QuickCalculator11Content initialEmbedPreset={initialEmbedPreset} initialWizardOpen={initialWizardOpen} />;
}
