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
      id="mobile-site-menu"
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "fixed inset-0 z-[90] h-dvh xl:hidden transition-all duration-500 ease-in-out bg-gradient-to-br from-[var(--red-dk)] via-[var(--red)] to-[var(--red-lt)]",
        isOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-20 sm:gap-6 sm:px-8 sm:pt-24">

        {/* Regular links */}
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "min-h-11 break-words border-b border-white/20 pb-3 font-serif text-xl font-bold transition-all sm:pb-4 sm:text-2xl",
              pathname === link.href ? "text-yellow-400 translate-x-2" : "text-white"
            )}
          >
            {link.label}
          </Link>
        ))}

        {/* Media group */}
        <div className="border-b border-white/20 pb-4">
          <p className="mb-3 text-xl font-serif font-bold text-white sm:text-2xl">{mediaLabel}</p>
          <div className="flex flex-col gap-2 pl-4">
            {mediaItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "min-h-11 break-words py-2 text-sm font-bold uppercase tracking-wide transition-colors sm:text-base",
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
