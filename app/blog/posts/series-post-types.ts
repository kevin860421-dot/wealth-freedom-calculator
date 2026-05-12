export type ExtendedSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type ExtendedSeriesPost = {
  slug: string;
  seriesNo: number;
  seriesLabel: string;
  title: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  calculatorMode?: "embed" | "direct-link";
  calculatorRoute: string;
  calculatorTitle: string;
  calculatorNote: string;
  sections: ExtendedSection[];
  closeQuestion: string;
  disclaimer: string;
};
