import { NextResponse } from "next/server";
import { parseFilters } from "@/lib/discovery";
import { getRuntime } from "@/server/runtime";
import { readPrototype } from "@/server/prototype-repository";
export async function GET(request: Request) {
  let filters;
  try {
    filters = parseFilters(
      Object.fromEntries(new URL(request.url).searchParams),
    );
  } catch {
    return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
  }
  try {
    const data = await readPrototype(getRuntime().db, filters);
    return NextResponse.json(
      {
        ...data,
        source: "development-records",
        label: data.businesses.length ? "Development data" : undefined,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
