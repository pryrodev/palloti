import type { Metadata } from "next";
import { i18n } from "../../i18n.config";
import { Header } from "../components/header";
import { Footer } from "../components/Footer";
import { getDictionary } from "@/lib/getDictionary";
import type { CSSProperties } from "react";
import { absoluteUrl } from "@/lib/seoPaths";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  return {
    title: dictionary.siteSeo.homeTitle,
    description: dictionary.siteSeo.homeDescription,
    alternates: {
      canonical: absoluteUrl(`/${lang}`),
      languages: { en: "/en", fr: "/fr" },
    },
  };
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div lang={lang} className="flex min-h-dvh flex-col" style={{
      "--red": dictionary.theme.red,
      "--red-dk": dictionary.theme.redDk,
      "--red-lt": dictionary.theme.redLt,
      "--gold": dictionary.theme.gold,
      "--gold-lt": dictionary.theme.goldLt,
      "--gold-dk": dictionary.theme.goldDk,
      "--cream": dictionary.theme.cream,
      "--cream2": dictionary.theme.cream2,
      "--cream3": dictionary.theme.cream3,
      "--dark": dictionary.theme.dark,
      "--mid": dictionary.theme.mid,
      "--gray": dictionary.theme.gray,
      "--white": dictionary.theme.white,
    } as CSSProperties}>
      <Header lang={lang} navigation={dictionary.navigation} />
      <div className="flex-1">{children}</div>
      <Footer lang={lang} dict={dictionary.footer} navigation={dictionary.navigation} />
    </div>
  );
}
