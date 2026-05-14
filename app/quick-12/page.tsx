import QuickCalculator12Content from "./QuickCalculator12Content";

type Quick12SearchParams = Record<string, string | string[] | undefined>;

function firstParam(params: Quick12SearchParams, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Quick12SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const pageRaw = firstParam(params, "page");
  const pkRaw = firstParam(params, "pk");
  const parsedPage = Number(pageRaw);
  const parsedPk = Number(pkRaw);
  const initialPage = Number.isFinite(parsedPage)
    ? (Math.max(0, Math.min(2, Math.round(parsedPage))) as 0 | 1 | 2)
    : undefined;
  const initialPkScenarioIdx = Number.isFinite(parsedPk) ? Math.max(0, Math.round(parsedPk)) : 0;

  return <QuickCalculator12Content initialPage={initialPage} initialPkScenarioIdx={initialPkScenarioIdx} />;
}
