import type { ReactNode } from "react";

/** useSearchParams 等 CSR bailout；根 layout 改 ISR 後須維持此段為動態渲染 */
export const dynamic = "force-dynamic";

export default function PostflowLibraryLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
