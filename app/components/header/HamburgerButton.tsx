import { cn } from "@/lib/utils";

export function HamburgerButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="xl:hidden grid size-11 shrink-0 place-items-center text-[var(--red)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
      aria-label="Toggle menu"
      aria-expanded={isOpen}
      aria-controls="mobile-site-menu"
    >
      <div className="w-5 h-4 relative flex flex-col justify-between">
        <span className={cn("w-full h-0.5 bg-current transition-all duration-300", isOpen && "rotate-45 translate-y-1.5")} />
        <span className={cn("w-full h-0.5 bg-current transition-all duration-300", isOpen && "opacity-0")} />
        <span className={cn("w-full h-0.5 bg-current transition-all duration-300", isOpen && "-rotate-45 -translate-y-1.5")} />
      </div>
    </button>
  );
}
