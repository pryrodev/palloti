import Link from "next/link";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "../language-switcher";

type NavLink = { href: string; label: string };
type MediaItem = { href: string; label: string };

export function MobileMenu({
  isOpen,
  navLinks,
  pathname,
  mediaLabel,
  mediaItems,
}: {
  isOpen: boolean;
  navLinks: NavLink[];
  pathname: string;
  mediaLabel: string;
  mediaItems: MediaItem[];
}) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] xl:hidden transition-all duration-500 ease-in-out bg-gradient-to-br from-[#3e2009] via-[#5c3317] to-[#7a4520]",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="flex flex-col h-full pt-24 px-8 gap-6 overflow-y-auto">

        {/* Regular links */}
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-2xl font-serif font-bold border-b border-white/20 pb-4 transition-all",
              pathname === link.href ? "text-yellow-400 translate-x-2" : "text-white"
            )}
          >
            {link.label}
          </Link>
        ))}

        {/* Media group */}
        <div className="border-b border-white/20 pb-4">
          <p className="text-2xl font-serif font-bold text-white mb-3">{mediaLabel}</p>
          <div className="flex flex-col gap-2 pl-4">
            {mediaItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-base font-bold tracking-wide uppercase transition-colors",
                  pathname === item.href ? "text-yellow-400" : "text-white/80 hover:text-yellow-400"
                )}
              >
                → {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-4 sm:hidden">
          <p className="text-xs uppercase tracking-widest text-white/50 mb-4">Select Language</p>
          <LanguageSwitcher />
        </div>
        <div className="mt-auto pb-10 text-center">
          <p className="text-yellow-400 font-bold text-sm tracking-widest">SAC HOLY FAMILY PROVINCE</p>
        </div>
      </div>
    </div>
  );
}
