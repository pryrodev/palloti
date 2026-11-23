import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";

function getCloudinaryCredentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  return { cloudName, apiKey, apiSecret };
}

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  const { cloudName, apiKey } = getCloudinaryCredentials();
  if (!cloudName || !apiKey) {
    return NextResponse.json(
      { error: "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY) are missing." },
      { status: 503 },
    );
  }
  return NextResponse.json({ cloudName, apiKey }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  if (!apiSecret || !apiKey || !cloudName) {
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
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return NextResponse.json({ signature: cloudinary.utils.api_sign_request(params, apiSecret) });
}
