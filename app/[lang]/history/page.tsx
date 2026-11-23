import Image from "next/image";
import { getDictionary } from "@/lib/getDictionary";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr ? "Histoire de la Province Sainte Famille" : "History of the Holy Family Province",
    description: isFr
      ? "Découvrez l'histoire de la Province Sainte Famille SAC, depuis les missions en 1890 jusqu'à l'érection canonique en Province en 2015."
      : "Discover the history of the Holy Family Province SAC, from the 1890 missions to the canonical erection as a Province in 2015.",
  };
}

type Chapter = { year: string; image: string; text: string; caption?: string };

export default async function HistoryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const { history } = dict;

  return (
    <>

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{history.badge}</p>
          <h1>{history.title}</h1>
        </div>
      </div>

      <main className="py-8 md:py-12 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">

          {(history.chapters as Chapter[]).map((chapter, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={index} className="relative mb-10 last:mb-0">

                {/* Timeline connector */}
                {index < history.chapters.length - 1 && (
                  <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-full w-px bg-[var(--gold)]/30"
                    style={{ height: "5rem" }} />
                )}

                <div className={`flex flex-col gap-10 items-center md:grid md:grid-cols-2 ${!isEven ? "md:flex-row-reverse" : ""}`}>

                  {/* Image side */}
                  <div className={!isEven ? "md:order-2" : ""}>
                    <div className="relative  overflow-hidden border-[3px] border-[var(--gold)]"
                      style={{ height: 320, boxShadow: "0 12px 40px rgba(139,26,26,0.12)" }}>
                      <Image src={chapter.image} alt={`History ${index + 1}`} fill className="object-cover" />
                      <div className="absolute top-4 left-4 px-4 py-2  font-bold text-sm bg-[var(--red)]"
                        style={{ fontFamily: "Georgia, serif", color: "#ffffff" }}>
                        {chapter.year}
                      </div>
                    </div>
                    {chapter.caption && (
                      <p className="mt-3 text-xs text-center italic text-[var(--gray)]">
                        {chapter.caption}
                      </p>
                    )}
                  </div>

                  {/* Text side */}
                  <div className={!isEven ? "md:order-1" : ""}>
                    <div className="mb-4 w-12 h-[3px]  bg-[var(--gold)]" />
                    <p className="leading-relaxed text-[var(--mid)]" style={{ fontSize: "1rem", lineHeight: "1.85" }}>
                      {chapter.text}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}

          {/* Stats banner */}
          <div className="mt-10  p-7 text-center bg-[var(--red)]" style={{ color: "#ffffff" }}>
            <p className="badge mb-4">
              {lang === "fr" ? "Province Sainte Famille · SAC" : "Holy Family Province · SAC"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-6 ">
              {[
                { number: (dict.home as Record<string, unknown>).statFoundedNum as string || "1890", label: lang === "fr" ? "Début de la mission" : "Mission began" },
                { number: (dict.home as Record<string, unknown>).statMembersNum as string || "111+",  label: lang === "fr" ? "Membres" : "Members" },
                { number: (dict.home as Record<string, unknown>).statCountriesNum as string || "3",    label: lang === "fr" ? "Pays" : "Countries" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="font-bold mb-1"
                    style={{ fontFamily: "Georgia, serif", color: "var(--gold)", fontSize: "clamp(2rem, 3.5vw, 3rem)" }}>{stat.number}</p>
                  <p className="text-sm uppercase tracking-widest" style={{ color: "#ffffff" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

    </>
  );
}
