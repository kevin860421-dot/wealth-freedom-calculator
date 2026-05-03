import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QUICK_SEO_BLOCKS } from "@/lib/quick-seo-data";

const block = QUICK_SEO_BLOCKS[9];

export const metadata: Metadata = {
  title: block.metaTitle,
  description: block.metaDescription,
};

export default function Quick9Layout({ children }: { children: ReactNode }) {
  return children;
}
