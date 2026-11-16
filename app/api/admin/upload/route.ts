import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  if (!isAuthenticated(req)) return unauthorized();

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string; // "image" | "video" | "pdf"

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let dir = "public/images";
  let urlPrefix = "/images";

  if (type === "video") { dir = "public/videos"; urlPrefix = "/videos"; }
  if (type === "pdf")   { dir = "public/pdfs";   urlPrefix = "/api/pdf"; }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const filePath = path.join(process.cwd(), dir, safeName);

  await writeFile(filePath, buffer);

  const url = type === "pdf" ? `/api/pdf/${safeName}` : `${urlPrefix}/${safeName}`;
  return NextResponse.json({ ok: true, url, name: safeName });
}
