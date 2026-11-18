import type { Metadata } from "next";
import { Mulish, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import QueryProvider from "@/components/QueryProvider";
import { SITE_URL } from "@/lib/seoPaths";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-mulish",
  display: "swap",
});

const BASE_URL = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "SAC Holy Family Province — Pallottines",
    template: "%s | SAC Holy Family Province",
  },
  description:
    "Official website of the Holy Family Province of the Society of the Catholic Apostolate (SAC — Pallottines). Inspired by Saint Vincent Pallotti, serving Rwanda, DR Congo and Belgium.",

  keywords: [
    "Pallottines", "SAC", "Holy Family Province", "Society of Catholic Apostolate",
    "Saint Vincent Pallotti", "Rwanda", "Kigali", "DR Congo", "Belgium",
    "Catholic", "Mission", "Province Sainte Famille",
  ],

  authors: [{ name: "SAC Holy Family Province", url: BASE_URL }],
  creator: "SAC Holy Family Province",
  publisher: "SAC Holy Family Province",

  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/icon.png",
    shortcut: "/icon.png",
  },

  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "SAC Holy Family Province",
    title: "SAC Holy Family Province — Pallottines",
    description:
      "Official website of the Holy Family Province of the Society of the Catholic Apostolate. Inspired by Saint Vincent Pallotti.",
    images: [
      {
        url: "/images/gikondo.jpg",
        width: 1200,
        height: 630,
        alt: "Holy Family Provincial House — Gikondo, Kigali",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    title: "SAC Holy Family Province — Pallottines",
    description:
      "Official website of the Holy Family Province of the Society of the Catholic Apostolate.",
    images: ["/images/gikondo.jpg"],
    creator: "@sac_psf",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: BASE_URL,
    languages: {
      "en": `${BASE_URL}/en`,
      "fr": `${BASE_URL}/fr`,
    },
  },

  category: "religion",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" className={cn("h-full", mulish.variable, "font-sans", geist.variable)}>
      <body className={`min-h-full flex flex-col antialiased ${mulish.className}`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
