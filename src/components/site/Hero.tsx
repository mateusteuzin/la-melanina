import { ShieldCheck, Clock, Heart } from "lucide-react";
import { WhatsappIcon } from "./WhatsappIcon";
import { Button } from "@/components/ui/button";
import hero from "@/assets/mayara_3.png";

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-gradient-hero">
      {/* Luxury Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-multiply pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
      
      <div className="container relative mx-auto grid gap-8 px-4 py-16 lg:grid-cols-2 lg:py-24 lg:items-center lg:gap-12">
        <div className="animate-fade-up lg:pr-6 z-10">
          <span className="inline-block rounded-full bg-background/80 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-wine shadow-sm backdrop-blur-sm">
            Bronzeamento Premium
          </span>
          <h1 className="mt-5 text-5xl font-bold leading-tight text-wine md:text-6xl lg:text-7xl drop-shadow-sm">
            Seu bronze,<br />sua melhor versão.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-foreground/80 font-medium leading-relaxed">
            Bronzeamento personalizado, ambiente acolhedor e atendimento cuidadoso para realçar sua beleza natural com aquela luz que só o bronze certo entrega.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-wine text-wine-foreground hover:bg-wine/90 rounded-full px-8 shadow-elegant transition-transform hover:-translate-y-1">
              <a href="#agendar" className="flex items-center gap-2">
                <WhatsappIcon className="size-4" />
                Agendar horário
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full border-wine/30 text-wine hover:bg-wine/5 hover:border-wine/50 transition-all">
              <a href="#servicos">Ver serviços</a>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { Icon: ShieldCheck, t: "Ambiente seguro", s: "e profissionais qualificadas" },
              { Icon: Clock, t: "Atendimento", s: "com horário marcado" },
              { Icon: Heart, t: "Conforto e cuidado", s: "para sua autoestima" },
            ].map(({ Icon, t, s }) => (
              <div key={t} className="flex items-start gap-3">
                <div className="rounded-full bg-wine/5 p-2 text-wine shadow-inner">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-wine">{t}</div>
                  <div className="text-xs font-medium text-foreground/70">{s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative animate-fade-up flex justify-center lg:justify-end z-10 mt-6 lg:mt-0">
          {/* Golden Glow Behind Image */}
          <div className="absolute inset-0 bg-amber-200/40 blur-[100px] rounded-full scale-90 -z-10 translate-y-10" />
          
          <img 
            src={hero} 
            alt="Mulher com pele bronzeada e iluminada" 
            width={1280} 
            height={1280} 
            className="relative rounded-[2.5rem] object-cover shadow-2xl w-full max-w-xl mx-auto lg:max-w-[680px] h-auto" 
          />
          
          {/* Soft shadow overlay for depth */}
          <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)] pointer-events-none max-w-xl mx-auto lg:max-w-[680px] w-full" />
        </div>
      </div>
    </section>
  );
}
