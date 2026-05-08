import { Clock, ShieldCheck, Sun } from "lucide-react";
import { WhatsappIcon } from "./WhatsappIcon";
import { Button } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="bg-gradient-wine text-wine-foreground">
      <div className="container mx-auto px-4 py-12 sm:py-16 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold md:text-4xl">Pronta para realçar sua melhor versão?</h2>
        <p className="mt-3 text-sm sm:text-base text-wine-foreground/80">Agende seu horário e viva a experiência LA MELANINA.</p>
        <Button asChild size="lg" className="mt-6 sm:mt-8 rounded-full bg-accent px-6 sm:px-8 text-wine hover:bg-accent/90 shadow-elegant">
          <a href="#agendar" className="flex items-center gap-2"><WhatsappIcon className="size-5" /> AGENDAR PELO WHATSAPP</a>
        </Button>
        <div className="mt-8 grid gap-3 sm:grid-cols-3 text-sm text-wine-foreground/85">
          <span className="flex items-center justify-center gap-2"><Clock className="size-4 shrink-0" />Atendimento com horário marcado</span>
          <span className="flex items-center justify-center gap-2"><ShieldCheck className="size-4 shrink-0" />Ambiente seguro e confortável</span>
          <span className="flex items-center justify-center gap-2"><Sun className="size-4 shrink-0" />Resultados que elevam a autoestima</span>
        </div>
      </div>
    </section>
  );
}
