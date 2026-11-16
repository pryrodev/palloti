import { checkAdminCookie } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

export const metadata = { title: "CMS Admin — SAC Holy Family Province" };

export default async function AdminPage() {
  const auth = await checkAdminCookie();
  if (!auth) redirect("/admin/login");
  return <AdminShell />;
}
