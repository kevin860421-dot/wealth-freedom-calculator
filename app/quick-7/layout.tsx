import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

const block = QUICK_SEO_BLOCKS[7];

export const metadata: Metadata = {
  title: block.metaTitle,
  description: block.metaDescription,
};

export default function Quick7Layout({ children }: { children: ReactNode }) {
  return children;
}
