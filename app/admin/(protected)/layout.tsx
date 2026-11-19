import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { checkAdminSession } from "@/lib/adminAuth";
import CmsQueryProvider from "../CmsQueryProvider";
import AdminShell from "../AdminShell";

export const metadata = { title: "CMS Admin — SAC Holy Family Province" };

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const auth = await checkAdminSession();
  if (!auth) redirect("/admin/login");

  return (
    <CmsQueryProvider>
      <AdminShell>{children}</AdminShell>
    </CmsQueryProvider>
  );
}
