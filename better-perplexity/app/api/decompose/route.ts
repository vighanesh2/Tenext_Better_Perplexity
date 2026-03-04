import { NextRequest, NextResponse } from "next/server";
import { decomposeQuery } from "@/lib/decompose";

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

    const subqueries = await decomposeQuery(query.trim());
    return NextResponse.json({ subqueries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Decomposition failed.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
