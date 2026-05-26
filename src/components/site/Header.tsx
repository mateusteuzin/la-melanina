import { useState, useCallback } from "react";
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
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-28 items-center justify-between px-4">
        <a href="#inicio" className="text-wine transition-transform duration-200 hover:scale-105 active:scale-95"><Logo height={88} /></a>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-wine active:scale-95 after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:w-0 after:bg-wine after:transition-all after:duration-200 hover:after:w-full"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild className="hidden sm:inline-flex bg-wine text-wine-foreground hover:bg-wine/90 rounded-full px-6 shadow-soft transition-transform duration-200 hover:scale-105 hover:shadow-md active:scale-95">
            <a href="#agendar" className="flex items-center gap-2"><WhatsappIcon className="size-4" /> AGENDAR</a>
          </Button>
          <button
            className="lg:hidden text-wine transition-transform duration-200 hover:scale-110 active:scale-90"
            onClick={toggle}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      <div
        className={`lg:hidden border-t border-border bg-background overflow-hidden transition-[opacity,transform,max-height] duration-[220ms] ease-out ${open ? "max-h-96 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2"}`}
        style={{ willChange: "opacity, transform" }}
      >
        <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors duration-150 hover:translate-x-1 active:scale-95"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
