import { QuickCalculator8View } from "./view";

type Quick8SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Quick8SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const rawInflation = Array.isArray(params.inflation) ? params.inflation[0] : params.inflation;
  const rawInflationRate = Array.isArray(params.inflation_rate) ? params.inflation_rate[0] : params.inflation_rate;
  const initialInflationAdjusted = rawInflation === "true" || rawInflation === "1";
  const parsedInflationPct = rawInflationRate != null ? Number(rawInflationRate) : 3;
  const initialInflationPct = Number.isFinite(parsedInflationPct)
    ? Math.max(0, Math.min(10, parsedInflationPct))
    : 3;

  return (
    <QuickCalculator8View
      initialInflationAdjusted={initialInflationAdjusted}
      initialInflationPct={initialInflationPct}
    />
  );
}
