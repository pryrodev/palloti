import { NextResponse } from "next/server";
import { readData } from "@/lib/getData";

export async function GET() {
  return NextResponse.json(readData("publications.json"));
}
