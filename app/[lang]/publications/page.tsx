import DecorativeDivider from "../../components/ui/DecorativeDivider";
import PublicationsClient from "./PublicationsClient";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/getDictionary";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return {
    title: dict.siteSeo.publicationsTitle,
    description: dict.siteSeo.publicationsDescription,
  };
}

export default async function PublicationsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  return (
    <>
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{dict.siteSeo.publicationsBadge}</p>
          <h1>{dict.navigation.publications}</h1>
          <p className="subtitle">{dict.siteSeo.publicationsSubtitle}</p>
        </div>
      </div>

      <main className="py-8 md:py-12 bg-[var(--cream)]">
        <div className="container mx-auto px-4 sm:px-6 md:px-12 lg:px-20">
          <PublicationsClient lang={lang} />
        </div>
      </main>

    </>
  );
}
