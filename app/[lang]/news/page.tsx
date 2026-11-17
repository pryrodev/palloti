import { Header } from "../../components/header";
import { Footer } from "../../components/Footer";
import { getDictionary } from "@/lib/getDictionary";
import NewsFilter from "../../components/NewsFilter";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr ? "Actualités & Publications" : "News & Publications",
    description: isFr
      ? "Dernières nouvelles, bulletins et publications de la Province Sainte Famille SAC."
      : "Latest news, newsletters and publications from the Holy Family Province SAC.",
  };
}

export default async function NewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const { newsSection } = dict;

  return (
    <>
      <Header lang={lang} navigation={dict.navigation} />
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{newsSection.badge}</p>
          <h1>{newsSection.title}</h1>
          <p className="subtitle">Province Sainte Famille · SAC</p>
        </div>
      </div>

      <main className="py-8 md:py-12 bg-[var(--cream)]">
        <div className="container mx-auto px-6 md:px-12 lg:px-20">
          <NewsFilter
            articles={newsSection.articles}
            readMore={newsSection.readMore}
            lang={lang}
            allPublicationsLabel={lang === "fr" ? "Toutes les Publications" : "All Publications"}
          />
        </div>
      </main>

      <Footer lang={lang} dict={dict.footer} navigation={dict.navigation} />
    </>
  );
}
