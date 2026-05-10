/** 共用型別：避免 quick1-exclusive ↔ quick11-posts 循環匯入 */

export type Quick1ExclusiveSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type TopicSeed = {
  slug: string;
  title: string;
  subtitle: string;
  seoTitle: string;
  metaDescription: string;
  focus: string;
  keywordA: string;
  keywordB: string;
  keywordC: string;
  closeQuestion: string;
  calculatorRoute?:
    | "/quick-1"
    | "/quick-2"
    | "/quick-3"
    | "/quick-4"
    | "/quick-5"
    | "/quick-6"
    | "/quick-7"
    | "/quick-8"
    | "/quick-9"
    | "/quick-10"
    | "/quick-11";
  calculatorName?: string;
  calculatorNote?: string;
  customSections?: Quick1ExclusiveSection[];
};
