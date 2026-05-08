import { Star } from "lucide-react";

const items = [
  { name: "Juliana A.", text: "Atendimento incrível e bronze perfeito! Me senti muito bem cuidada e o resultado ficou maravilhoso. Super recomendo!" },
  { name: "Beatriz M.", text: "O resultado ficou natural, uniforme e lindo. Amei! Já virei cliente fiel." },
  { name: "Carla D.", text: "Ambiente maravilhoso, confortável e muito profissional. Me senti em casa!" },
  { name: "Mariana S.", text: "Melhor bronzeamento que já fiz! Pele iluminada, sem manchas e com resultado impecável." },
];

export function Testimonials() {
  return (
    <section className="bg-accent/30 py-14 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-wine md:text-4xl">O que nossas clientes dizem</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((t) => (
            <div key={t.name} className="rounded-3xl border border-border bg-card p-5 sm:p-6 text-center shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-3 flex justify-center gap-0.5 text-bronze">
                {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-current" />)}
              </div>
              <p className="text-sm italic text-foreground/80">"{t.text}"</p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full bg-gradient-bronze text-sm font-semibold text-bronze-foreground">
                  {t.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">Cliente</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
