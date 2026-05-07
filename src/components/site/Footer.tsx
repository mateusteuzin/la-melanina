import { Logo } from "./Logo";
import { Instagram, Phone, MapPin, Clock, Send } from "lucide-react";
import { WhatsappIcon } from "./WhatsappIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer id="contato" className="border-t border-border bg-background">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-2 lg:grid-cols-4">

        <div className="text-wine">
          <Logo height={120} />

          <p className="mt-4 text-sm text-muted-foreground">
            Realçamos sua beleza natural com cuidado, qualidade e resultados que transformam.
          </p>

          <div className="mt-4 flex gap-3">
            <a
              href="https://www.instagram.com/la_melaniina/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-border p-2 text-wine transition hover:bg-muted"
            >
              <Instagram className="size-4" />
            </a>

            <a
              href="https://wa.me/558896241621"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="rounded-full border border-border p-2 text-wine transition hover:bg-muted"
            >
              <WhatsappIcon className="size-4" />
            </a>
          </div>
        </div>

        <div>
          <div className="mb-3 font-semibold text-foreground">
            Links rápidos
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Início",
              "Sobre",
              "Serviços",
              "Resultados",
              "Dúvidas",
              "Contato",
            ].map((l) => (
              <li key={l}>
                <a
                  href={`#${l
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/\p{Diacritic}/gu, "")}`}
                  className="hover:text-wine transition"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-3 font-semibold text-foreground">
            Contato
          </div>

          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-wine" />
              +55 88 9624-1621
            </li>

            <li className="flex items-center gap-2">
              <Instagram className="size-4 text-wine" />
              <a href="https://www.instagram.com/la_melaniina/" target="_blank" rel="noreferrer" className="hover:text-wine transition">
                @la_melaniina
              </a>
            </li>

            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-wine" />
              Proximo a pizzaria conterrâneo - Lagoa seca, Itarema - CE, 62590-000
            </li>

            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 text-wine" />
              <span>
                Seg a Sex: 09h às 20h
                <br />
                Sáb: 09h às 18h
              </span>
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-3 font-semibold text-foreground">
            Newsletter
          </div>

          <p className="text-sm text-muted-foreground">
            Receba dicas e novidades exclusivas.
          </p>

          <form className="mt-3 flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              className="bg-card"
            />

            <Button
              type="submit"
              size="icon"
              className="bg-wine text-wine-foreground hover:bg-wine/90"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t border-border bg-wine py-4 text-center text-xs text-wine-foreground/80">
        © 2026 LA MELANINA. Todos os direitos reservados.
      </div>
    </footer>
  );
}