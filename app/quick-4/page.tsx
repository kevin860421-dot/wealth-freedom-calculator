import QuickCalculator4View from "./view";
import { parseQuick4PresetFromSearchParams } from "./embed-preset";

type Quick4SearchParams = Record<string, string | string[] | undefined>;

export default async function QuickCalculator4Page({
  searchParams,
}: {
  searchParams?: Promise<Quick4SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const sp = {
    get(key: string) {
      const v = params[key];
      return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
    },
  };
  const initialEmbedPreset = parseQuick4PresetFromSearchParams(sp);

  return <QuickCalculator4View initialEmbedPreset={initialEmbedPreset} />;
}
