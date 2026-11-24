import Image from "next/image";
import { getDictionary } from "@/lib/getDictionary";
import { readPublishedData } from "@/lib/getData";
import type { Metadata } from "next";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import { User, BookOpen, Quote } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  const isIt = lang === "it";
  const title = isFr ? "Catalogue des Confrères" : isIt ? "Catalogo dei Confratelli" : "Confreres Catalog";
  const description = isFr
    ? "Biographies et portraits des membres et confrères de la Province Sainte Famille SAC."
    : isIt
    ? "Biografie e ritratti dei membri e confratelli della Provincia Santa Famiglia SAC."
    : "Biographies and portraits of the members and confreres of the Holy Family Province SAC.";
  return { title, description };
}

type Member = {
  name: string;
  role?: string;
  image?: string;
  biography?: string;
  birthYear?: string;
  deathYear?: string;
  lifeStatus?: "living" | "deceased" | "unknown";
};

export default async function CatalogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const isFr = lang === "fr";
  const isIt = lang === "it";

  const members = await readPublishedData<Member[]>("catalog", "catalog.json");

  const pageBadge = isFr ? "Province Sainte Famille SAC" : isIt ? "Provincia Santa Famiglia SAC" : "Holy Family Province SAC";
  const pageTitle = isFr ? "Catalogue des Confrères" : isIt ? "Catalogo dei Confratelli" : "Confreres Catalog";
  const pageSubtitle = isFr
    ? "Portraits et biographies des confrères et responsables engagés dans la mission de Saint Vincent Pallotti."
    : isIt
    ? "Ritratti e biografie dei confratelli e responsabili impegnati nella missione di San Vincenzo Pallotti."
    : "Portraits and biographies of confreres and leaders dedicated to the mission of Saint Vincent Pallotti.";

  return (
    <>
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{pageBadge}</p>
          <h1>{pageTitle}</h1>
          <p className="subtitle">{pageSubtitle}</p>
        </div>
      </div>

      <main className="min-h-dvh bg-[var(--cream)] py-10 md:py-16">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--cream3)] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-dk)]">
                {isFr ? "Portraits & Biographies" : isIt ? "Ritratti & Biografie" : "Portraits & Biographies"}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[var(--dark)]">
                {isFr ? "Membres de la communauté" : isIt ? "Membri della comunità" : "Community Members"}
              </h2>
            </div>
            <span className="text-xs font-semibold tabular-nums text-[var(--mid)]">
              {members.length} {isFr ? "membres" : isIt ? "membri" : "members"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {members.map((member, index) => (
              <article
                key={index}
                className="group flex flex-col overflow-hidden border border-[var(--cream3)] bg-white shadow-[0_6px_20px_rgba(58,31,10,0.06)] transition-all duration-300 hover:shadow-[0_12px_30px_rgba(58,31,10,0.12)]"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Photo container */}
                  <div className="relative aspect-[4/5] w-full shrink-0 bg-[var(--cream2)] sm:w-48">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 192px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-[var(--gold-dk)] opacity-40">
                        <User className="size-16" />
                      </div>
                    )}
                  </div>

                  {/* Header info */}
                  <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                    <div>
                      <span className="inline-block bg-[var(--cream)] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[var(--gold-dk)]">
                        {member.role || (isFr ? "Confrère" : isIt ? "Confratello" : "Confrere")}
                      </span>
                      <h3
                        className="mt-2 text-xl font-bold leading-snug text-[var(--dark)]"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {member.name}
                      </h3>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--mid)]">
                      <BookOpen className="size-3.5 text-[var(--gold-dk)]" />
                      <span>{isFr ? "Notice biographique" : isIt ? "Profilo biografico" : "Biographical profile"}</span>
                    </div>
                    {member.lifeStatus && member.lifeStatus !== "unknown" && <p className="mt-3 text-xs font-semibold text-[var(--mid)]">
                      <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: member.lifeStatus === "living" ? "#4d7c55" : "#8b7355" }} />
                      {member.birthYear || member.deathYear ? `${member.birthYear || "?"} – ${member.lifeStatus === "living" ? (isFr ? "Aujourd’hui" : isIt ? "Presente" : "Present") : member.deathYear || "?"} · ` : ""}
                      {member.lifeStatus === "living" ? (isFr ? "Vivant" : isIt ? "Vivente" : "Living") : (isFr ? "Décédé" : isIt ? "Deceduto" : "Deceased")}
                    </p>}
                  </div>
                </div>

                {/* Biography body */}
                <div className="border-t border-[var(--cream3)] bg-[#faf8f5] p-5 sm:p-6">
                  {member.biography ? (
                    <div className="prose prose-sm max-w-none text-xs leading-relaxed text-[var(--mid)] sm:text-sm">
                      <p className="whitespace-pre-line">{member.biography}</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 text-xs italic text-[var(--mid)] opacity-75">
                      <Quote className="size-4 shrink-0 text-[var(--gold-dk)]" />
                      <p>
                        {isFr
                          ? "Membre dévoué de la Société de l'Apostolat Catholique (SAC), participant activement à la vie et à la mission apostolique de la Province Sainte Famille."
                          : isIt
                          ? "Membro dedicato della Società dell'Apostolato Cattolico (SAC), partecipa attivamente alla vita e alla missione apostolica della Provincia Santa Famiglia."
                          : "Dedicated member of the Society of the Catholic Apostolate (SAC), actively participating in the apostolic life and mission of the Holy Family Province."}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
