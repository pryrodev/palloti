import { randomUUID } from "node:crypto";
import { Readable, Transform } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { pipeline } from "node:stream/promises";
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { z } from "zod";
import { isAuthenticated, unauthorized } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 100_000_000;
const importSchema = z.object({
  fileId: z.string().min(1).max(256).regex(/^[\w-]+$/),
  accessToken: z.string().min(20).max(4096),
  resourceType: z.enum(["image", "video", "raw"]).optional(),
});

const googleWorkspaceExports: Record<string, { mimeType: string; extension: string }> = {
  "application/vnd.google-apps.document": { mimeType: "application/pdf", extension: "pdf" },
  "application/vnd.google-apps.spreadsheet": { mimeType: "application/pdf", extension: "pdf" },
  "application/vnd.google-apps.presentation": { mimeType: "application/pdf", extension: "pdf" },
};

const supportedTypes: Record<string, "image" | "video" | "raw"> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "image",
  "image/avif": "image",
  "video/mp4": "video",
  "video/quicktime": "video",
  "video/webm": "video",
  "application/pdf": "raw",
  "application/msword": "raw",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "raw",
  "application/vnd.ms-excel": "raw",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "raw",
  "application/vnd.ms-powerpoint": "raw",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "raw",
};

const fileExtensions: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
};

function uploadDriveStream(
  body: ReadableStream<Uint8Array>,
  options: { resourceType: "image" | "video" | "raw"; publicId: string },
) {
  return new Promise<{
    public_id: string;
    url: string;
    secure_url: string;
    resource_type: string;
    format?: string;
    bytes: number;
    width?: number;
    height?: number;
  }>((resolve, reject) => {
    let receivedBytes = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        receivedBytes += chunk.length;
        if (receivedBytes > MAX_FILE_BYTES) {
          callback(new Error("This file is larger than the 100 MB upload limit."));
          return;
        }
        callback(null, chunk);
      },
    });
    const destination = cloudinary.uploader.upload_stream({
      folder: "pallotti-cms",
      public_id: options.publicId,
      resource_type: options.resourceType,
      overwrite: false,
    }, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary returned an empty upload result."));
      resolve(result);
    });

    pipeline(Readable.fromWeb(body as unknown as NodeReadableStream), limit, destination).catch(reject);
  });
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated(req))) return unauthorized();

  const parsed = importSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid Google Drive file selection." }, { status: 400 });
  if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: "Cloudinary is not configured." }, { status: 503 });
  }

  const { fileId, accessToken, resourceType: expectedResourceType } = parsed.data;
  const headers = { Authorization: `Bearer ${accessToken}` };
  const metadataResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size`,
    { headers, cache: "no-store" },
  ).catch(() => null);
  if (!metadataResponse?.ok) {
    return NextResponse.json({ error: "Google Drive could not provide this file. Reconnect and try again." }, { status: 400 });
  }

  const metadata = z.object({
    id: z.string(),
    name: z.string().min(1).max(1024),
    mimeType: z.string().min(1).max(255),
    size: z.string().optional(),
  }).safeParse(await metadataResponse.json().catch(() => null));
  if (!metadata.success) return NextResponse.json({ error: "Google Drive returned invalid file details." }, { status: 400 });

  const exportDetails = googleWorkspaceExports[metadata.data.mimeType];
  const mimeType = exportDetails?.mimeType ?? metadata.data.mimeType;
  const mediaType = supportedTypes[mimeType];
  if (!mediaType || (expectedResourceType && expectedResourceType !== mediaType)) {
    return NextResponse.json({ error: "This file type is not supported in this field." }, { status: 415 });
  }
  const declaredBytes = Number(metadata.data.size);
  if (!exportDetails && Number.isFinite(declaredBytes) && declaredBytes > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "This file is larger than the 100 MB upload limit." }, { status: 413 });
  }

  const downloadUrl = exportDetails
    ? `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(exportDetails.mimeType)}`
    : `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  const downloadResponse = await fetch(downloadUrl, { headers, cache: "no-store" }).catch(() => null);
  if (!downloadResponse?.ok || !downloadResponse.body) {
    return NextResponse.json({ error: "Google Drive could not download this file." }, { status: 400 });
  }
  const contentLength = Number(downloadResponse.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES) {
    await downloadResponse.body.cancel();
    return NextResponse.json({ error: "This file is larger than the 100 MB upload limit." }, { status: 413 });
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const safeName = metadata.data.name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "drive-file";
  const extension = exportDetails?.extension
    ?? metadata.data.name.match(/\.([a-zA-Z0-9]{1,10})$/)?.[1]?.toLowerCase()
    ?? fileExtensions[mimeType];
  const publicId = `drive-${safeName}-${randomUUID()}${mediaType === "raw" && extension ? `.${extension}` : ""}`;

  try {
    const uploaded = await uploadDriveStream(downloadResponse.body, { resourceType: mediaType, publicId });
    const asset = await prisma.mediaAsset.upsert({
      where: { publicId: uploaded.public_id },
      create: {
        publicId: uploaded.public_id,
        url: uploaded.url,
        secureUrl: uploaded.secure_url,
        resourceType: mediaType,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
      },
      update: {
        url: uploaded.url,
        secureUrl: uploaded.secure_url,
        resourceType: mediaType,
        format: uploaded.format,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
      },
    });
    return NextResponse.json(asset, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.message.includes("100 MB")
      ? error.message
      : "This Google Drive file could not be imported.";
    return NextResponse.json({ error: message }, { status: message.includes("100 MB") ? 413 : 502 });
  }
}
