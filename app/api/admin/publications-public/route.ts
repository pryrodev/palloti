import { NextResponse } from "next/server";
import { readPublishedData } from "@/lib/getData";

export async function GET() {
  return NextResponse.json(await readPublishedData("publications", "publications.json"), { headers: { "Cache-Control": "no-store" } });
}
