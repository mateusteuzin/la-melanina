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
        <a href="#inicio" className="text-wine"><Logo height={88} /></a>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-foreground/80 transition-colors hover:text-wine">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild className="hidden sm:inline-flex bg-wine text-wine-foreground hover:bg-wine/90 rounded-full px-6 shadow-soft">
            <a href="#agendar" className="flex items-center gap-2"><WhatsappIcon className="size-4" /> AGENDAR</a>
          </Button>
          <button className="lg:hidden text-wine" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
