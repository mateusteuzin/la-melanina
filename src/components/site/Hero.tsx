import { ArrowRight, ArrowUpRight } from "lucide-react";
import hero from "@/assets/mayara_3.png";

export function Hero() {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="scroll-mt-20 border-b border-wine/10 bg-background sm:scroll-mt-32">
      <div className="mx-auto max-w-6xl px-5 pb-8 pt-8 sm:px-8 sm:py-12 lg:py-16">
        <div className="grid items-center gap-7 sm:gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-wine/80 sm:text-xs">
              <span className="h-px w-6 bg-wine/40" aria-hidden="true" />
              La Melanina · Bronzeamento
            </p>
            <h1 id="hero-title" className="mt-5 font-serif text-[clamp(2.5rem,9.5vw,3.5rem)] font-medium leading-[1.06] tracking-[-0.035em] text-wine lg:mt-7 lg:text-[4.5rem]">
              Seu tom.<br />
              <span className="italic">Seu brilho.</span><br />
              Seu momento.
            </h1>
            <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-foreground/75 sm:text-base lg:mt-6 lg:text-lg">
              Bronzeamento personalizado, com cuidado em cada detalhe para valorizar a sua beleza.
            </p>
            <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-5 lg:mt-8">
              <a href="#agendar" className="inline-flex min-h-13 items-center justify-center gap-5 rounded-lg bg-wine px-6 py-3.5 text-sm font-semibold text-wine-foreground transition-colors hover:bg-wine/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine">
                Agendar meu bronze
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a href="#servicos" className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-wine underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-wine">
                Conhecer os serviços
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            </div>
            <p className="mt-3 text-xs text-muted-foreground lg:mt-5">Escolha seu serviço e veja os horários disponíveis.</p>
          </div>

          <figure className="min-w-0">
            <div className="aspect-[6/5] overflow-hidden rounded-2xl border border-wine/10 bg-secondary sm:aspect-[4/3] lg:aspect-[4/5]">
              <img
                src={hero}
                alt="Profissional da La Melanina com instrumentos de bronzeamento no estúdio"
                width={1280}
                height={1280}
                fetchPriority="high"
                className="h-full w-full object-cover object-[center_30%] lg:object-center"
              />
            </div>
            <figcaption className="flex flex-wrap items-center justify-between gap-2 px-0.5 pt-3 text-xs text-muted-foreground">
              <span className="font-medium text-wine">Cuidado em cada detalhe.</span>
              <span>Espaço La Melanina</span>
            </figcaption>
          </figure>
        </div>

        <div className="mt-7 grid grid-cols-3 divide-x divide-wine/10 border-t border-wine/10 pt-5 text-center sm:mt-10 sm:pt-6 lg:mt-12">
          {[
            ["01", "Seu tom", "Bronze personalizado"],
            ["02", "Seu tempo", "Horário marcado"],
            ["03", "Seu espaço", "Ambiente acolhedor"],
          ].map(([number, title, description]) => (
            <div key={number} className="px-2 sm:flex sm:items-center sm:justify-center sm:gap-4 sm:text-left">
              <span className="hidden font-serif text-2xl italic text-wine/45 sm:block" aria-hidden="true">{number}</span>
              <div>
                <p className="text-xs font-semibold text-wine sm:text-sm">{title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
