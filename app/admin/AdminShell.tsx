"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  FolderOpen,
  Globe,
  Images,
  LayoutDashboard,
  LogOut,
  Network,
  Newspaper,
  Palette,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Gallery", href: "/admin/gallery", icon: Images },
  { label: "Videos", href: "/admin/videos", icon: Video },
  { label: "Publications", href: "/admin/publications", icon: FileText },
  { label: "Communities", href: "/admin/communities", icon: Users },
  { label: "Direction", href: "/admin/direction", icon: Network },
  { label: "Media Library", href: "/admin/media", icon: FolderOpen },
  { label: "Site Content & Theme", href: "/admin/site-content", icon: Palette },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activeItem = NAV.find((item) => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)) ?? NAV[0];
  const ActiveIcon = activeItem.icon;

  async function logout() {
    await authClient.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8f4ef", fontFamily: "system-ui, sans-serif" }}>
      <aside className="flex h-screen w-56 shrink-0 flex-col" style={{ background: "linear-gradient(180deg, #3e2009 0%, #5c3317 100%)" }}>
        <div className="flex flex-col items-center border-b border-white/10 px-4 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/p4.png" alt="SAC Logo" className="mb-1 h-10 w-10 object-contain" />
          <p className="text-center text-xs font-black leading-tight tracking-wider text-white">
            <span className="font-bold text-[#C9952A]">CMS Admin</span>
          </p>
        </div>

        <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem.href === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className="mb-1 flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C9952A]"
                style={{
                  background: isActive ? "rgba(201,149,42,0.2)" : "transparent",
                  color: isActive ? "#C9952A" : "rgba(255,255,255,0.7)",
                  borderLeft: isActive ? "3px solid #C9952A" : "3px solid transparent",
                }}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-white/10 p-4">
          <a href="/en" target="_blank" rel="noreferrer" className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 transition-colors hover:text-white">
            <Globe aria-hidden="true" className="size-4" /> View Site
          </a>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 transition-colors hover:text-red-300">
            <LogOut aria-hidden="true" className="size-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex h-screen min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-white px-8 py-2.5 shadow-sm">
          <div>
            <h1 className="flex items-center gap-2 text-base font-black text-gray-800">
              <ActiveIcon aria-hidden="true" className="size-4 text-[#9e711a]" />
              {activeItem.label}
            </h1>
            <p className="text-[11px] text-gray-400">{activeItem.href === "/admin" ? "Overview of your site content" : "Manage and publish content"}</p>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
