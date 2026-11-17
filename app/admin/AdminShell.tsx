"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NewsEditor from "./sections/NewsEditor";
import GalleryEditor from "./sections/GalleryEditor";
import VideosEditor from "./sections/VideosEditor";
import PublicationsEditor from "./sections/PublicationsEditor";
import CommunitiesEditor from "./sections/CommunitiesEditor";
import DirectionEditor from "./sections/DirectionEditor";
import CmsQueryProvider from "./CmsQueryProvider";
import MediaLibrary from "./sections/MediaLibrary";

const NAV = [
  { key: "news",         label: "News",          icon: "📰" },
  { key: "gallery",      label: "Gallery",        icon: "🖼️" },
  { key: "videos",       label: "Videos",         icon: "🎬" },
  { key: "publications", label: "Publications",   icon: "📄" },
  { key: "communities",  label: "Communities",    icon: "🏘️" },
  { key: "direction",    label: "Direction",      icon: "👥" },
  { key: "media",        label: "Media Library",  icon: "🗂️" },
];

export default function AdminShell() {
  const [active, setActive] = useState("news");
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <CmsQueryProvider>
    <div className="min-h-screen flex" style={{ background: "#f8f4ef", fontFamily: "system-ui, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col"
        style={{ background: "linear-gradient(180deg, #3e2009 0%, #5c3317 100%)", minHeight: "100vh" }}>
        {/* Logo */}
        <div className="flex flex-col items-center py-8 px-4 border-b border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/p4.png" alt="SAC Logo" className="w-12 h-12 object-contain mb-2" />
          <p className="text-xs font-black tracking-wider text-white text-center leading-tight">
            SAC · PSF<br />
            <span className="text-[#C9952A] font-bold">CMS Admin</span>
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2">
          {NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActive(item.key)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-1 transition-all text-sm font-bold"
              style={{
                background: active === item.key ? "rgba(201,149,42,0.2)" : "transparent",
                color: active === item.key ? "#C9952A" : "rgba(255,255,255,0.7)",
                borderLeft: active === item.key ? "3px solid #C9952A" : "3px solid transparent",
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer links */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <a href="/en" target="_blank"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-white transition-colors">
            <span>🌐</span> View Site
          </a>
          <button onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/60 hover:text-red-400 transition-colors">
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-100 shadow-sm">
          <div>
            <h1 className="text-lg font-black text-gray-800">
              {NAV.find((n) => n.key === active)?.icon}{" "}
              {NAV.find((n) => n.key === active)?.label}
            </h1>
            <p className="text-xs text-gray-400">Manage and publish content</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">● Live</span>
          </div>
        </div>

        {/* Editor area */}
        <div className="p-8">
          {active === "news"         && <NewsEditor />}
          {active === "gallery"      && <GalleryEditor />}
          {active === "videos"       && <VideosEditor />}
          {active === "publications" && <PublicationsEditor />}
          {active === "communities"  && <CommunitiesEditor />}
          {active === "direction"    && <DirectionEditor />}
          {active === "media"        && <MediaLibrary />}
        </div>
      </main>
    </div>
    </CmsQueryProvider>
  );
}
