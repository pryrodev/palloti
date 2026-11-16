import { Header } from "../../components/header";
import { Footer } from "../../components/Footer";
import { getDictionary } from "@/lib/getDictionary";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import PublicationsClient from "./PublicationsClient";

export default async function PublicationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = getDictionary(lang);

  return (
    <>
      <Header lang={lang} navigation={dict.navigation} />
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{lang === "fr" ? "Médias" : "Media"}</p>
          <h1>{lang === "fr" ? "Publications" : "Publications"}</h1>
          <p className="subtitle">{lang === "fr" ? "Documents, livres et ressources · Province Sainte Famille" : "Documents, books & resources · Holy Family Province"}</p>
        </div>
      </div>

      <main className="py-8 md:py-12 bg-[var(--cream)]">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
          <PublicationsClient lang={lang} />
        </div>
      </main>

      <Footer lang={lang} dict={dict.footer} navigation={dict.navigation} />
    </>
  );
}
