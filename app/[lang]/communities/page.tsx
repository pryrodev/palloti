import { Header } from "../../components/header";
import { Footer } from "../../components/Footer";
import { getDictionary } from "@/lib/getDictionary";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import CommunitiesFilter from "../../components/CommunitiesFilter";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr ? "Communautés & Apostolats" : "Communities & Apostolates",
    description: isFr
      ? "Découvrez les communautés et les œuvres apostoliques de la Province Sainte Famille au Rwanda, en RD Congo, en Belgique et au-delà."
      : "Discover the communities and apostolic works of the Holy Family Province in Rwanda, DR Congo, Belgium and beyond.",
  };
}

export default async function CommunitiesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <>
      <Header lang={lang} navigation={dict.navigation} />
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{dict.communities.badge}</p>
          <h1>{dict.communities.title}</h1>
          <p className="subtitle">{dict.communities.subtitle}</p>
        </div>
      </div>

      <main className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-6">
          <CommunitiesFilter
            communities={dict.communities.items}
            labels={dict.communities.filterLabels}
          />
        </div>
      </main>

      <Footer lang={lang} dict={dict.footer} navigation={dict.navigation} />
    </>
  );
}
