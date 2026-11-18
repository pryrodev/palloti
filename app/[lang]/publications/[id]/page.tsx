import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { readPublishedData } from "@/lib/getData";
import { absoluteUrl, getPublicationSegment } from "@/lib/seoPaths";
import DecorativeDivider from "../../../components/ui/DecorativeDivider";
import type { Publication } from "../publicationsQuery";

async function getPublication(identifier: string) {
  const publications = await readPublishedData<Publication[]>("publications", "publications.json");
  return publications.find((publication) =>
    String(publication.id) === identifier || publication.slug === identifier || identifier.endsWith(`-${String(publication.id)}`),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const publication = await getPublication(id);
  if (!publication) return { title: lang === "fr" ? "Publication introuvable" : "Publication not found" };

  const title = publication.seoTitle?.trim() || publication.title;
  const description = publication.seoDescription?.trim() || publication.description;
  const canonical = absoluteUrl(`/${lang}/publications/${getPublicationSegment(publication)}`);
  const image = absoluteUrl("/p4.png");
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical, images: [{ url: image }] },
    twitter: { card: "summary", title, description, images: [image] },
  };
}

export default async function PublicationPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const publication = await getPublication(id);
  if (!publication) notFound();

  const canonical = absoluteUrl(`/${lang}/publications/${getPublicationSegment(publication)}`);
  const pdfUrl = publication.url?.startsWith("/") ? absoluteUrl(publication.url) : publication.url;
  const structuredPublication = {
    "@context": "https://schema.org",
    "@type": "DigitalDocument",
    name: publication.title,
    description: publication.seoDescription?.trim() || publication.description,
    url: pdfUrl || canonical,
    mainEntityOfPage: canonical,
    inLanguage: lang,
    publisher: { "@type": "Organization", name: "SAC Holy Family Province" },
  };

  return (
    <>
      <DecorativeDivider />
      <main className="min-h-screen bg-[var(--cream)] pb-16">
        <div className="container mx-auto px-4 pt-6 sm:px-6 md:pt-10">
          <Link href={`/${lang}/publications`} className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--red)] hover:text-[var(--gold-dk)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
            <ArrowLeft aria-hidden="true" className="size-4" />{lang === "fr" ? "Toutes les publications" : "All publications"}
          </Link>

          <article className="mx-auto max-w-5xl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredPublication).replace(/</g, "\\u003c") }} />
            <div className="grid gap-8 border-y border-[var(--cream3)] py-8 sm:gap-12 sm:py-12 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
              <div className="mx-auto flex h-[360px] w-[240px] flex-col justify-between p-7 shadow-[5px_8px_20px_rgba(0,0,0,0.18)] sm:h-[420px] sm:w-[280px]" style={{ background: publication.color }}>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-75" style={{ color: publication.titleColor }}>PSF / {publication.number}</span>
                <BookOpen aria-hidden="true" className="size-16 opacity-20" style={{ color: publication.titleColor }} />
                <h1 className="font-serif text-2xl font-black leading-tight sm:text-3xl" style={{ color: publication.titleColor }}>{publication.title}</h1>
                <p className="text-[10px] font-bold uppercase leading-relaxed tracking-[0.16em]" style={{ color: publication.subtitleColor }}>{publication.subtitle}</p>
              </div>

              <div className="max-w-2xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-dk)]">{lang === "fr" ? "Publication provinciale" : "Provincial publication"} · PSF / {publication.number}</p>
                <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-[var(--dark)] sm:text-4xl">{publication.title}</h1>
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-dk)]">{publication.subtitle}</p>
                <span aria-hidden="true" className="my-6 block h-[2px] w-14 bg-[var(--gold)]" />
                <p className="text-base leading-8 text-[var(--mid)]">{publication.description}</p>
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-3 bg-[var(--red)] px-5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--red-dk)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">
                    <Download aria-hidden="true" className="size-4" />{lang === "fr" ? "Lire le document" : "Read document"}<ArrowUpRight aria-hidden="true" className="size-4" />
                  </a>
                )}
              </div>
            </div>
          </article>
        </div>
      </main>
    </>
  );
}
