import Image from "next/image";
import Link from "next/link";

export function Logo({ lang }: { lang: string }) {
  return (
    <Link href={`/${lang}`} className="flex items-center gap-2 group shrink-0">
      <Image
        src="/p4.png"
        alt="Logo"
        width={206}
        height={40}
        sizes="128px"
        className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
        priority
      />
    </Link>
  );
}
