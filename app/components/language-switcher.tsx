"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRef } from "react";
import { i18n } from "../../i18n.config";

export const LanguageSwitcher = () => {
  const pathName = usePathname();
  const switchingLocale = useRef(false);

  const currentLocale = pathName?.split("/")[1];

  const redirectedPathName = (locale: string) => {
    if (!pathName) return "/";
    const segments = pathName.split("/");
    segments[1] = locale;
    return segments.join("/");
  };

  function switchLocale(event: React.MouseEvent<HTMLAnchorElement>, locale: string) {
    if (!pathName || currentLocale === locale || switchingLocale.current) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    switchingLocale.current = true;
    if (locale === "en") {
      const expired = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = `googtrans=; ${expired}; path=/`;
      document.cookie = `googtrans=; ${expired}; path=/; domain=${window.location.hostname}`;
    }
    window.location.assign(redirectedPathName(locale));
  }

  return (
    <div className="flex items-center gap-1">
      {i18n.locales.map((locale, index) => {
        const isActive = currentLocale === locale;
        return (
          <span key={locale} className="flex items-center gap-1">
            {isActive ? (
              <span aria-current="page" className="text-xs font-bold uppercase tracking-widest px-2 py-1" style={{ color: "#fff", backgroundColor: "var(--red)" }}>
                {locale}
              </span>
            ) : (
              <Link
                href={redirectedPathName(locale)}
                onClick={(event) => switchLocale(event, locale)}
                className="text-xs font-bold uppercase tracking-widest px-2 py-1 transition-colors"
                style={{ color: "var(--red)", backgroundColor: "transparent" }}
              >
                {locale}
              </Link>
            )}
            {index < i18n.locales.length - 1 && (
              <span style={{ color: "#d1d5db", fontSize: "0.7rem" }}>|</span>
            )}
          </span>
        );
      })}
    </div>
  );
};
