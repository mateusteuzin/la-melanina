import { useState, useCallback, useRef, useEffect } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  // Fecha ao clicar fora do menu
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="relative sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-28 items-center justify-between px-4">
        <a href="#inicio" className="text-wine transition-transform duration-200 hover:scale-105 active:scale-95"><Logo height={88} /></a>
        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="relative text-sm font-medium text-foreground/80 transition-colors duration-200 hover:text-wine after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:w-0 after:bg-wine after:transition-all after:duration-200 hover:after:w-full"
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
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {/* Menu mobile: dropdown compacto */}
      <div
        ref={menuRef}
        className={`lg:hidden absolute top-full left-0 right-0 mx-4 border border-border/40 bg-background/90 backdrop-blur-sm rounded-xl shadow-md overflow-hidden transition-[opacity,transform] duration-[190ms] ease-out ${open ? "opacity-100 translate-y-1 pointer-events-auto" : "opacity-0 -translate-y-3 pointer-events-none"}`}
        style={{ willChange: "transform, opacity", zIndex: 999 }}
      >
        <nav className="flex flex-col py-1.5">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={close}
              className="px-5 py-2.5 text-sm font-medium text-foreground/70 hover:text-wine hover:bg-wine/5 transition-colors duration-150"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
