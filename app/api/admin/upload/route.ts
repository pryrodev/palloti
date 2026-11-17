import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();
  return NextResponse.json(
    { error: "Local filesystem uploads are disabled. Select or upload files through the Cloudinary media library." },
    { status: 410 },
  );
}
