import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "Cloudinary is not configured" }, { status: 503 });
  }
  const incoming = await req.json() as Record<string, unknown>;
  const params = Object.fromEntries(Object.entries(incoming).filter(([key, value]) =>
    ["timestamp", "folder", "public_id", "source", "type", "upload_preset", "eager", "tags", "context"].includes(key) &&
    (typeof value === "string" || typeof value === "number"),
  )) as Record<string, string | number>;
  const timestamp = Number(params.timestamp);
  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (!Number.isInteger(timestamp) || age > 600 || params.folder !== "pallotti-cms") {
    return NextResponse.json({ error: "Invalid upload signature parameters" }, { status: 400 });
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return NextResponse.json({ signature: cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET) });
}
