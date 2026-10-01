import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 只標記各大部落格隔離預覽，讓根層不要掛分析與 GameFi。 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-blog-outlet", "1");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/postflow/outlet/:path*"],
};
