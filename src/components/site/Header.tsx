import { useState } from "react";
import { Menu, X } from "lucide-react";
import { WhatsappIcon } from "./WhatsappIcon";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#inicio", label: "Início" },
  { href: "#sobre", label: "Sobre" },
  { href: "#servicos", label: "Serviços" },
  { href: "#resultados", label: "Resultados" },
  { href: "#duvidas", label: "Dúvidas" },
  { href: "#contato", label: "Contato" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-28 items-center justify-between px-4">
        <a href="#inicio" className="text-wine transition-transform duration-300 hover:scale-105 active:scale-95"><Logo height={88} /></a>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-foreground/80 transition-all duration-300 hover:text-wine active:scale-95 after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:w-0 after:bg-wine after:transition-all after:duration-300 hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild className="hidden sm:inline-flex bg-wine text-wine-foreground hover:bg-wine/90 rounded-full px-6 shadow-soft transition-all duration-300 hover:scale-105 hover:shadow-md active:scale-95">
            <a href="#agendar" className="flex items-center gap-2"><WhatsappIcon className="size-4" /> AGENDAR</a>
          </Button>
          <button
            className="lg:hidden text-wine transition-all duration-300 hover:scale-110 active:scale-90"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            <span className="block transition-all duration-300">
              {open ? <X /> : <Menu />}
            </span>
          </button>
        </div>
      </div>
      <div
        className={`lg:hidden border-t border-border bg-background overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted transition-all duration-200 hover:translate-x-1 active:scale-95"
              style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
