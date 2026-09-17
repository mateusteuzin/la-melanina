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

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <header className="relative sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container mx-auto flex h-18 items-center justify-between px-4 sm:h-28">
        <a href="#inicio" className="text-wine transition-transform duration-200 hover:scale-105 active:scale-95">
          <Logo height={88} className="max-h-14 sm:max-h-22" />
        </a>
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-sm font-medium text-foreground/80 transition-colors duration-200 after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:w-0 after:bg-wine after:transition-all after:duration-200 hover:text-wine hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild className="hidden rounded-full bg-wine px-6 text-wine-foreground shadow-soft transition-transform duration-200 hover:scale-105 hover:bg-wine/90 hover:shadow-md active:scale-95 sm:inline-flex">
            <a href="#agendar" className="flex items-center gap-2">
              <WhatsappIcon className="size-4" /> AGENDAR
            </a>
          </Button>
          <button
            className="text-wine transition-transform duration-200 hover:scale-110 active:scale-90 lg:hidden"
            onClick={toggle}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <div
        ref={menuRef}
        className={`absolute left-0 right-0 top-full z-[999] mx-4 overflow-hidden rounded-xl border border-border/40 bg-background/90 shadow-md backdrop-blur-sm transition-[opacity,transform] duration-[190ms] ease-out lg:hidden ${
          open ? "pointer-events-auto translate-y-1 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <nav className="flex flex-col py-1.5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              className="px-5 py-2.5 text-sm font-medium text-foreground/70 transition-colors duration-150 hover:bg-wine/5 hover:text-wine"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
