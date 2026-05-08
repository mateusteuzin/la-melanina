import { Sparkles, CalendarCheck, Sofa, Award } from "lucide-react";

const items = [
  { Icon: Sparkles, t: "Bronze natural e uniforme", d: "Cor dourada, sem manchas e com acabamento impecável." },
  { Icon: CalendarCheck, t: "Atendimento exclusivo", d: "Horário marcado, sem espera, totalmente para você." },
  { Icon: Sofa, t: "Ambiente confortável", d: "Espaço sofisticado, climatizado e pensado no seu bem-estar." },
  { Icon: Award, t: "Profissionais qualificadas", d: "Técnica avançada e produtos premium para um resultado seguro." },
];

export function Benefits() {
  return (
    <section className="container mx-auto px-4 py-14 sm:py-20">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-wine md:text-4xl">Cuidado em cada detalhe</h2>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">Tudo o que você precisa para um bronze perfeito.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ Icon, t, d }) => (
          <div key={t} className="group rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
            <div className="mb-4 inline-flex size-11 sm:size-12 items-center justify-center rounded-2xl bg-gradient-bronze text-bronze-foreground transition-transform group-hover:scale-110">
              <Icon className="size-5 sm:size-6" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
