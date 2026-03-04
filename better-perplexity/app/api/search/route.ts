import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Missing or invalid query string" },
        { status: 400 }
      );
    }

    const results = await search(query.trim());
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
