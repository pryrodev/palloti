import type { Metadata } from "next";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { getDictionary } from "@/lib/getDictionary";
import DecorativeDivider from "../../components/ui/DecorativeDivider";
import ContactForm from "../../components/ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "fr" ? "Contact | Province Sainte Famille" : "Contact | Holy Family Province",
    description: lang === "fr"
      ? "Contactez le bureau de la Province Sainte Famille à Gikondo, Kigali."
      : "Contact the Holy Family Province office in Gikondo, Kigali.",
  };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const phoneNumbers = dict.footer.phone.split("/").map((number: string) => number.trim());
  const mapQuery = encodeURIComponent(dict.footer.address);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`;

  return (
    <>
      <DecorativeDivider />
      <div className="page-banner">
        <div className="container mx-auto px-6">
          <p className="badge">{dict.contactPage.badge}</p>
          <h1>{dict.contactPage.title}</h1>
          <p className="subtitle">{dict.contactPage.subtitle}</p>
        </div>
      </div>

      <main className="bg-[var(--cream)] py-8 md:py-12">
        <div className="container mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:px-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12 lg:px-16">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--gold)]" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-dk)]">{dict.contactPage.contactInfo}</h2>
              <span className="h-px flex-1 bg-[var(--cream3)]" />
            </div>

            <div className="divide-y divide-[var(--cream3)] border-y border-[var(--cream3)] bg-white px-5">
              <section className="flex gap-4 py-5">
                <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--cream3)] text-[var(--gold-dk)]">
                  <MapPin aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--dark)]">{dict.contactPage.addressLabel}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--mid)]">{dict.footer.address}</p>
                </div>
              </section>
              <section className="flex gap-4 py-5">
                <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--cream3)] text-[var(--gold-dk)]">
                  <Phone aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--dark)]">{dict.contactPage.phoneLabel}</h3>
                  <ul className="mt-1 space-y-1">
                    {phoneNumbers.map((number: string) => (
                      <li key={number}>
                        <a href={`tel:${number.replace(/[^\d+]/g, "")}`} className="text-sm text-[var(--mid)] underline decoration-[var(--cream3)] underline-offset-4 hover:text-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">{number}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
              {dict.footer.email && (
                <section className="flex gap-4 py-5">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-[var(--cream3)] text-[var(--gold-dk)]">
                    <Mail aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--dark)]">{dict.contactPage.email || "Email"}</h3>
                    <p className="mt-1">
                      <a href={`mailto:${dict.footer.email}`} className="text-sm text-[var(--mid)] underline decoration-[var(--cream3)] underline-offset-4 hover:text-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]">{dict.footer.email}</a>
                    </p>
                  </div>
                </section>
              )}
            </div>

            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--red)] hover:text-[var(--gold-dk)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold)]">
              {dict.contactPage.openMap}<ArrowUpRight aria-hidden="true" className="size-4" />
            </a>

            <div className="mt-6 aspect-[4/3] overflow-hidden border border-[var(--cream3)] bg-[var(--cream2)]">
              <iframe
                title={dict.contactPage.mapTitle}
                src={mapEmbedUrl}
                className="size-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </div>

          <ContactForm labels={dict.contactPage} />
        </div>
      </main>
    </>
  );
}
