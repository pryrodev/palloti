import type { Metadata } from "next";
import { i18n } from "../../i18n.config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr ? "Accueil — Province Sainte Famille" : "Home — Holy Family Province",
    description: isFr
      ? "Site officiel de la Province Sainte Famille de la Société de l'Apostolat Catholique (SAC). Inspirés par Saint Vincent Pallotti."
      : "Official website of the Holy Family Province of the Society of the Catholic Apostolate (SAC — Pallottines). Inspired by Saint Vincent Pallotti.",
    alternates: {
      canonical: `https://pallotti-website.vercel.app/${lang}`,
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
  return <div lang={lang}>{children}</div>;
}
