import { NextRequest } from "next/server";
import { getAdminCollection, putAdminCollection } from "@/lib/adminCmsApi";

export async function GET(req: NextRequest) {
  return getAdminCollection(req, "publications");
}

export async function PUT(req: NextRequest) {
  return putAdminCollection(req, "publications");
}
