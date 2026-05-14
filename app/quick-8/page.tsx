import { QuickCalculator8View } from "./view";

type Quick8SearchParams = Record<string, string | string[] | undefined>;

const QUICK8_BUILTIN_RATES: Record<string, number> = {
  "0050": 8.5,
  "00878": 6.5,
  "00919": 7,
  "00929": 7,
  "2330": 10.5,
};

function firstParam(params: Quick8SearchParams, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function parsePositiveNumber(raw: string | undefined, max: number): number | undefined {
  if (raw == null) return undefined;
  const n = Number(raw.replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.min(max, n);
}

function parseSceneName(raw: string | undefined): string | undefined {
  const text = raw?.trim().replace(/\s+/g, " ");
  if (!text) return undefined;
  return text.slice(0, 40);
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Quick8SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const rawInflation = firstParam(params, "inflation");
  const rawInflationRate = firstParam(params, "inflation_rate");
  const sceneName = parseSceneName(firstParam(params, "etf"));
  const single = parsePositiveNumber(firstParam(params, "single"), 500000);
  const monthly = parsePositiveNumber(firstParam(params, "monthly"), 500000);
  const years = parsePositiveNumber(firstParam(params, "years") ?? firstParam(params, "y"), 50);
  const explicitRate = parsePositiveNumber(firstParam(params, "rate"), 99);
  const builtinRate = sceneName ? QUICK8_BUILTIN_RATES[sceneName.toUpperCase()] : undefined;
  const initialInflationAdjusted = rawInflation === "true" || rawInflation === "1";
  const parsedInflationPct = rawInflationRate != null ? Number(rawInflationRate) : 3;
  const initialInflationPct = Number.isFinite(parsedInflationPct)
    ? Math.max(0, Math.min(10, parsedInflationPct))
    : 3;

  return (
    <QuickCalculator8View
      initialInflationAdjusted={initialInflationAdjusted}
      initialInflationPct={initialInflationPct}
      initialScenario={{
        name: sceneName,
        single,
        monthly,
        years,
        rate: explicitRate ?? builtinRate,
      }}
    />
  );
}
