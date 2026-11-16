import { NextResponse, type NextRequest } from "next/server";
import { previewEnabled } from "@/lib/preview-policy";
// Runtime gating only; every page and private API still authenticates on the server.
export function proxy(request: NextRequest) {
  if (!previewEnabled())
    return NextResponse.rewrite(new URL("/preview-unavailable", request.url), {
      status: 404,
      headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" },
    });
  return NextResponse.next();
}
export const config = { matcher: ["/dev/:path*", "/design"] };
