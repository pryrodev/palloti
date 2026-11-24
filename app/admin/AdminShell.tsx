"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  BookOpen,
  FolderOpen,
  Globe,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Network,
  Newspaper,
  Palette,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authClient } from "@/lib/auth-client";

const NAV: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "News", href: "/admin/news", icon: Newspaper },
  { label: "Gallery", href: "/admin/gallery", icon: Images },
  { label: "Videos", href: "/admin/videos", icon: Video },
  { label: "Catalog", href: "/admin/catalog", icon: BookOpen },
  { label: "Publications", href: "/admin/publications", icon: FileText },
  { label: "Communities", href: "/admin/communities", icon: Users },
  { label: "Direction", href: "/admin/direction", icon: Network },
  { label: "Media Library", href: "/admin/media", icon: FolderOpen },
  { label: "Site Content & Theme", href: "/admin/site-content", icon: Palette },
];

function AdminNavigation({
  activeHref,
  onNavigate,
  onLogout,
}: {
  activeHref: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return <div className="flex h-full min-h-0 flex-col text-white">
    <div className="flex shrink-0 flex-col items-center border-b border-white/10 px-4 py-4 sm:py-5">
      <Image src="/p4.png" alt="SAC logo" width={206} height={40} className="mb-1 h-auto w-10 object-contain" />
      <p className="text-center text-xs font-black leading-tight tracking-wider text-white">
        <span className="font-bold text-[#C9952A]">CMS Admin</span>
      </p>
    </div>

    <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto px-2 py-3 sm:py-4">
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = activeHref === item.href;
        return <Link
          key={item.href}
          href={item.href}
          prefetch={false}
          onClick={onNavigate}
          aria-current={isActive ? "page" : undefined}
          className={`group mb-1.5 flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-bold rounded-sm transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#C9952A] ${
            isActive
              ? "bg-[#C9952A]/20 text-[#C9952A] border-l-[3px] border-[#C9952A] shadow-xs"
              : "text-white/80 border-l-[3px] border-transparent hover:bg-white/10 hover:text-white hover:translate-x-1 hover:border-[#C9952A]/50 active:scale-[0.98]"
          }`}
        >
          <Icon aria-hidden="true" className={`size-4 shrink-0 transition-transform duration-200 ${isActive ? "text-[#C9952A]" : "text-white/70 group-hover:text-white group-hover:scale-110"}`} />
          <span className="min-w-0 flex-1 break-words">{item.label}</span>
        </Link>;
      })}
    </nav>

    <div className="shrink-0 space-y-1 border-t border-white/10 p-3 sm:p-4">
      <a href="/en" target="_blank" rel="noreferrer" onClick={onNavigate} className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-xs text-white/75 transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-1 rounded-sm">
        <Globe aria-hidden="true" className="size-4" /> View Site
      </a>
      <button type="button" onClick={onLogout} className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/75 transition-all duration-150 hover:bg-white/10 hover:text-white hover:translate-x-1 rounded-sm">
        <LogOut aria-hidden="true" className="size-4" /> Sign Out
      </button>
    </div>
  </div>;
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeItem = NAV.find((item) => item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href)) ?? NAV[0];
  const ActiveIcon = activeItem.icon;

  async function logout() {
    setMobileMenuOpen(false);
    await authClient.signOut();
    router.replace("/admin/login");
  }

  return (
    <div className="flex h-dvh min-h-0 min-w-0 overflow-hidden" style={{ background: "#f8f4ef", fontFamily: "system-ui, sans-serif" }}>
      <aside className="hidden h-full w-56 shrink-0 flex-col bg-[linear-gradient(180deg,#3e2009_0%,#5c3317_100%)] lg:flex">
        <AdminNavigation activeHref={activeItem.href} onLogout={() => void logout()} />
      </aside>

      <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 bg-white px-3 py-2.5 shadow-sm sm:px-4 lg:px-8">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger render={<Button type="button" variant="outline" size="icon" className="shrink-0 rounded-none border-[#eadfd2] text-[#5C3317] lg:hidden" aria-label="Open admin navigation" />}>
              <Menu aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="left" showCloseButton className="w-[min(86vw,18rem)] max-w-none gap-0 border-0 bg-[linear-gradient(180deg,#3e2009_0%,#5c3317_100%)] text-white">
              <AdminNavigation activeHref={activeItem.href} onNavigate={() => setMobileMenuOpen(false)} onLogout={() => void logout()} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="flex min-w-0 items-center gap-2 text-sm font-black text-gray-800 sm:text-base">
              <ActiveIcon aria-hidden="true" className="size-4 shrink-0 text-[#9e711a]" />
              <span className="truncate">{activeItem.label}</span>
            </h1>
            <p className="truncate text-[10px] text-gray-500 sm:text-xs">
              {activeItem.href === "/admin" ? "Overview of your site content" : "Manage and publish content"}
            </p>
          </div>
        </header>
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
