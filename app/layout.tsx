import type { Metadata } from "next";
import { Mulish, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const mulish = Mulish({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pallottines — Rwanda Province",
  description: "Official website of the Pallottine Community, Rwanda Province (SAC). Inspired by Saint Vincent Pallotti.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={cn("h-full", mulish.variable, "font-sans", geist.variable)}>
      <body className={`min-h-full flex flex-col antialiased ${mulish.className}`}>
        {children}
      </body>
    </html>
  );
}
