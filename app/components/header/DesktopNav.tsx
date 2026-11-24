"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

type NavLink = { href: string; label: string };
type MediaItem = { href: string; label: string };

const linkClass = (active: boolean) =>
  cn(
    "px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors  relative",
    "hover:bg-transparent hover:text-[var(--gold)]",
    active
      ? "text-[var(--red)] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[2px] after:bg-[var(--red)] "
      : "text-[var(--mid)]"
  );

export function DesktopNav({
  navLinks,
  pathname,
  mediaLabel,
  mediaItems,
}: {
  navLinks: NavLink[];
  pathname: string;
  mediaLabel: string;
  mediaItems: MediaItem[];
}) {
  return (
    <div className="hidden xl:flex items-center">
      <NavigationMenu>
        <NavigationMenuList className="gap-0">

          {/* Regular links */}
          {navLinks.map((link) => (
            <NavigationMenuItem key={link.href}>
              <NavigationMenuLink
                render={<Link href={link.href} />}
                className={linkClass(pathname === link.href)}
              >
                {link.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          ))}

          {/* Media dropdown (Gallery, Videos, Publications, Catalog) */}
          <NavigationMenuItem>
            <NavigationMenuTrigger
              className={cn(
                "text-xs font-bold uppercase tracking-wider bg-transparent hover:bg-transparent hover:text-[var(--gold)] focus:bg-transparent data-[state=open]:bg-transparent data-[state=open]:text-[var(--gold)] px-3 py-1.5",
                mediaItems.some((m) => pathname === m.href)
                  ? "text-[var(--red)]"
                  : "text-[var(--mid)]"
              )}
            >
              {mediaLabel}
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="w-48 p-1">
                {mediaItems.map((item) => (
                  <li key={item.href}>
                    <NavigationMenuLink
                      render={<Link href={item.href} />}
                      className={cn(
                        "px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors block",
                        pathname === item.href
                          ? "text-[var(--red)] bg-[var(--cream2)]"
                          : "text-[var(--mid)] hover:text-[var(--gold)] hover:bg-[var(--cream2)]"
                      )}
                    >
                      {item.label}
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
