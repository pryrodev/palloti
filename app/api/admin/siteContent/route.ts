import { NextRequest } from "next/server";
import { getAdminCollection, putAdminCollection } from "@/lib/adminCmsApi";

export async function GET(request: NextRequest) {
  return getAdminCollection(request, "siteContent");
}

export async function PUT(request: NextRequest) {
  return putAdminCollection(request, "siteContent");
}
