import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  if (!filename.endsWith(".pdf")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "public", "pdfs", filename);

  if (!existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileBuffer = await readFile(filePath);
  const uint8Array = new Uint8Array(fileBuffer);

  return new NextResponse(uint8Array, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": fileBuffer.length.toString(),
      "Content-Disposition": `inline; filename="${filename}"`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
