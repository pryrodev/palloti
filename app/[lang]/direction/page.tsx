import Image from "next/image";
import { getDictionary } from "@/lib/getDictionary";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isFr = lang === "fr";
  return {
    title: isFr ? "Gouvernement Provincial" : "Provincial Government",
    description: isFr
      ? "Rencontrez les membres du gouvernement provincial de la Province Sainte Famille SAC."
      : "Meet the members of the provincial government of the Holy Family Province SAC.",
  };
}
import DecorativeDivider from "../../components/ui/DecorativeDivider";

type Member = { name: string; role: string; image: string };

export default async function DirectionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const members = dict.direction.members as Member[];
  const rector = members[0];
  const consultors = members.slice(1);

  return (
    <>
      <DecorativeDivider />

      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{dict.direction.badge}</p>
          <h1>{dict.direction.title}</h1>
          <p className="subtitle">{dict.direction.subtitle}</p>
        </div>
      </div>

      <main className="bg-[var(--cream)] py-8 md:py-12">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">

          {/* Rector — featured card */}
          <article className="mb-8 grid overflow-hidden bg-white shadow-[0_12px_36px_rgba(58,31,10,0.08)] md:mb-12 md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] bg-[var(--cream2)] md:mx-0">
              <Image src={rector.image} alt={rector.name} fill sizes="(max-width: 767px) 80vw, 220px" className="object-contain p-2" priority />
            </div>
            <div className="flex min-w-0 flex-col justify-center px-6 py-7 text-center sm:px-9 md:px-12 md:py-10 md:text-left">
              <p className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[var(--gold-dk)]">{rector.role}</p>
              <h2 className="text-2xl font-bold leading-tight text-[var(--red)] sm:text-3xl"
                style={{ fontFamily: "Georgia, serif" }}>{rector.name}</h2>
            </div>
          </article>

          {/* Consultors grid */}
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {consultors.map((member, index) => (
              <article key={index} className="group flex h-full min-w-0 flex-col overflow-hidden bg-white shadow-[0_8px_24px_rgba(58,31,10,0.07)] transition-shadow duration-300 hover:shadow-[0_14px_32px_rgba(58,31,10,0.13)]">
                <div className="relative aspect-[4/5] w-full bg-[var(--cream2)]">
                  <Image src={member.image} alt={member.name} fill sizes="(max-width: 419px) 100vw, (max-width: 1023px) 45vw, 22vw" className="object-contain p-2" />
                </div>
                <div className="flex flex-1 flex-col px-4 py-5 text-center sm:px-5">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--gold-dk)]">
                    {member.role}
                  </p>
                  <h3 className="text-sm font-bold leading-snug text-[var(--dark)]" style={{ fontFamily: "Georgia, serif" }}>
                    {member.name}
                  </h3>
                </div>
              </article>
            ))}
          </div>

        </div>
      </main>

    </>
  );
}
