import { ArrowDownRight } from "lucide-react";
import { WhatsappIcon } from "./WhatsappIcon";
import { Button } from "@/components/ui/button";
import hero from "@/assets/mayara_3.png";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden border-b border-wine/10 bg-background">
      <div className="pointer-events-none absolute left-0 top-0 h-full w-[7px] bg-wine sm:w-2" aria-hidden="true" />

      <div className="container mx-auto grid px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:min-h-[720px] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:pb-20 lg:pt-20 xl:gap-24">
        <div className="relative z-10 max-w-2xl pl-2 sm:pl-4 lg:pl-0">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-wine/65 sm:text-xs">
            <span className="h-px w-10 bg-wine/40" aria-hidden="true" />
            La Melanina · Bronzeamento personalizado
          </div>

          <h1 className="mt-7 max-w-[11ch] font-serif text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[0.91] tracking-[-0.045em] text-wine">
            Bronze bonito é o que parece seu.
          </h1>

          <div className="mt-8 grid gap-6 border-t border-wine/15 pt-6 sm:grid-cols-[1fr_auto] sm:items-end lg:max-w-xl">
            <p className="max-w-md text-base leading-7 text-foreground/72 sm:text-lg sm:leading-8">
              Técnica, cuidado e um resultado pensado para valorizar o seu tom de pele — sem pressa e sem exagero.
            </p>
            <span className="hidden font-serif text-5xl italic leading-none text-accent sm:block" aria-hidden="true">LM</span>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-13 rounded-none bg-wine px-7 text-sm font-semibold text-wine-foreground shadow-none transition-colors hover:bg-wine/90 sm:px-8"
            >
              <a href="#agendar">
                <WhatsappIcon className="size-4" />
                Quero meu horário
              </a>
            </Button>
            <a
              href="#servicos"
              className="group inline-flex h-12 items-center justify-center gap-2 border-b border-wine/25 px-4 text-sm font-semibold text-wine outline-none transition-colors hover:border-wine focus-visible:ring-2 focus-visible:ring-wine sm:justify-start"
            >
              Conhecer os serviços
              <ArrowDownRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </a>
          </div>

          <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:text-xs">
            Atendimento individual <span className="mx-2 text-accent">●</span> Horário marcado <span className="mx-2 text-accent">●</span> Ambiente acolhedor
          </p>
        </div>

        <figure className="relative mt-12 pl-5 sm:mt-14 sm:pl-10 lg:mt-0 lg:pl-12">
          <div className="absolute bottom-6 left-0 top-[-18px] w-[44%] bg-wine sm:bottom-10 sm:top-[-28px]" aria-hidden="true" />
          <div className="relative aspect-[4/5] max-h-[680px] overflow-hidden bg-muted">
            <img
              src={hero}
              alt="Profissional da La Melanina no estúdio de bronzeamento"
              width={1280}
              height={1280}
              className="h-full w-full object-cover object-center"
            />
          </div>

          <figcaption className="absolute bottom-5 left-0 max-w-[245px] border-l-4 border-accent bg-background px-5 py-4 shadow-elegant sm:bottom-8 sm:max-w-xs sm:px-6 sm:py-5">
            <p className="font-serif text-lg font-semibold leading-tight text-wine sm:text-xl">
              Natural no tom.<br />Preciso no cuidado.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Cada pele pede uma atenção diferente.
            </p>
          </figcaption>

          <div className="absolute right-3 top-3 bg-background/92 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-wine backdrop-blur-sm sm:right-5 sm:top-5 sm:text-[10px]">
            Espaço de bronzeamento
          </div>
        </figure>
      </div>
    </section>
  );
}
