import { NextResponse } from "next/server";
import { previewEnabled } from "@/lib/preview-policy";
import { parseFilters } from "@/lib/discovery";
import { getRuntime } from "@/server/runtime";
import { requirePrincipal } from "@/server/authorization";
import { readPrototype } from "@/server/prototype-repository";
import { AppError } from "@/server/errors";
export async function GET(request: Request) {
  if (!previewEnabled())
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    const { db, auth } = getRuntime();
    const principal = await requirePrincipal(db, auth, request.headers);
    let filters;
    try {
      filters = parseFilters(
        Object.fromEntries(new URL(request.url).searchParams),
      );
    } catch {
      return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
    }
    const result = await readPrototype(db, principal, filters);
    return NextResponse.json(
      { ...result, label: "Development data" },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex",
        },
      },
    );
  } catch (error) {
    const status = error instanceof AppError ? error.status : 503;
    return NextResponse.json(
      { error: status === 503 ? "UNAVAILABLE" : "ACCESS_DENIED" },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
