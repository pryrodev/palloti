"use client";

import { useRouter } from "next/navigation";
import Dashboard from "../sections/Dashboard";

const ADMIN_PATHS: Record<string, string> = {
  news: "/admin/news",
  gallery: "/admin/gallery",
  videos: "/admin/videos",
  publications: "/admin/publications",
  communities: "/admin/communities",
  direction: "/admin/direction",
  media: "/admin/media",
  siteContent: "/admin/site-content",
};

export default function AdminPage() {
  const router = useRouter();
  return <Dashboard onNavigate={(section) => router.push(ADMIN_PATHS[section] ?? "/admin")} />;
}
