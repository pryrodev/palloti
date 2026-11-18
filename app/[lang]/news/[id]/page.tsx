import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DecorativeDivider from "../../../components/ui/DecorativeDivider";
import ArticleBody from "./ArticleBody";
import { getDictionary } from "@/lib/getDictionary";
import { absoluteUrl, getArticleSegment, parseDateForSeo } from "@/lib/seoPaths";

type Article = {
  id: number | string;
  slug?: string;
  title: string;
  seoTitle?: string;
  seoDescription?: string;
  date: string;
  tags: string;
  summary: string;
  content?: string;
  imageUrl: string;
};

async function getArticle(lang: string, identifier: string) {
  const dictionary = await getDictionary(lang);
  return (dictionary.newsSection.articles as Article[]).find((item) =>
    String(item.id) === identifier || item.slug === identifier || identifier.endsWith(`-${String(item.id)}`),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const article = await getArticle(lang, id);
  if (!article) return { title: lang === "fr" ? "Article introuvable" : "Article not found" };

  const title = article.seoTitle?.trim() || article.title;
  const description = article.seoDescription?.trim() || article.summary;
  const image = absoluteUrl(article.imageUrl);
  const canonical = absoluteUrl(`/${lang}/news/${getArticleSegment(article)}`);
  const publishedTime = parseDateForSeo(article.date);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: [{ url: image, alt: article.title }],
      ...(publishedTime ? { publishedTime } : {}),
      tags: article.tags.split("|").map((tag) => tag.trim()).filter(Boolean),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  const article = await getArticle(lang, id);
  if (!article) notFound();

  const backLabel = lang === "fr" ? "Retour aux actualités" : "Back to news";
  const canonical = absoluteUrl(`/${lang}/news/${getArticleSegment(article)}`);
  const publishedTime = parseDateForSeo(article.date);
  const structuredArticle = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.seoDescription?.trim() || article.summary,
    image: [absoluteUrl(article.imageUrl)],
    ...(publishedTime ? { datePublished: publishedTime } : {}),
    mainEntityOfPage: canonical,
    inLanguage: lang,
    author: { "@type": "Organization", name: "SAC Holy Family Province" },
    publisher: {
      "@type": "Organization",
      name: "SAC Holy Family Province",
      logo: { "@type": "ImageObject", url: absoluteUrl("/p4.png") },
    },
  };

  return (
    <>
      <DecorativeDivider />
      <main className="min-h-screen bg-[var(--cream)] pb-16">
        <div className="container mx-auto px-4 pt-6 sm:px-6 md:pt-10">
          <Link href={`/${lang}/news`} className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--red)] hover:text-[var(--gold-dk)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
            <ArrowLeft aria-hidden="true" className="size-4" />{backLabel}
          </Link>

          <article className="mx-auto max-w-5xl">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredArticle).replace(/</g, "\\u003c") }} />
            <div className="relative aspect-[16/8] max-h-[560px] min-h-56 overflow-hidden bg-[var(--cream2)] sm:min-h-80">
              <Image src={article.imageUrl} alt={article.title} fill priority sizes="(max-width: 1023px) 100vw, 1024px" className="object-cover" />
            </div>

            <div className="mx-auto max-w-3xl px-5 py-8 sm:px-10 sm:py-12 lg:px-16">
              <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--cream3)] pb-4">
                <time dateTime={publishedTime} className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-dk)]">{article.date}</time>
                <span className="h-1 w-1 bg-[var(--gold)]" />
                <p className="text-[10px] font-semibold uppercase leading-relaxed tracking-[0.14em] text-[var(--mid)]">{article.tags}</p>
              </div>

              <h1 className="font-serif text-3xl font-bold leading-tight text-[var(--dark)] sm:text-4xl lg:text-5xl">{article.title}</h1>
              <span aria-hidden="true" className="my-7 block h-[2px] w-14 bg-[var(--gold)]" />

              <ArticleBody content={article.content ?? ""} fallback={article.summary} />

              <div className="mt-10 border-t border-[var(--cream3)] pt-6">
                <Link href={`/${lang}/news`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--red)] hover:text-[var(--gold-dk)]">
                  <ArrowLeft aria-hidden="true" className="size-4" />{backLabel}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>
    </>
  );
}
