import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/discovery";
export async function GET(request: Request) {
  try {
    parseFilters(Object.fromEntries(new URL(request.url).searchParams));
  } catch {
    return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
  }
  // M0 has no genuine activated public profiles. Never fall back to private fixture tables.
  return NextResponse.json(
    {
      businesses: [],
      posts: [],
      categories: [],
      source: "verified-public",
      message: "No verified public profiles are available yet.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
