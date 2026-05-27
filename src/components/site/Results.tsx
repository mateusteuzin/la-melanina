import { useInView } from "@/hooks/useInView";
import resultado1 from "@/assets/resultado 1.png";

import bronzeCabine from "@/assets/bronze cabine.png";
import modeloGringo from "@/assets/modelo gringo.png";

const items = [
  { 
    image: resultado1,
    title: "Bronze Natural" 
  },
  { 
    image: bronzeCabine,
    title: "Resultado na Cabine" 
  },
  { 
    image: modeloGringo,
    title: "Marquinha Real" 
  },
];

export function Results() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as any} id="resultados" className={`container mx-auto px-4 py-14 sm:py-20 section-hidden ${inView ? "section-visible" : ""}`}>
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-bold text-wine md:text-4xl">Resultados que realçam sua beleza</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
          Bronze natural, pele iluminada e autoestima elevada. Veja resultados reais das nossas clientes.
        </p>
      </div>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.title}
            className="group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant sm:h-[560px]"
          >
            <div className="relative aspect-[3/4] overflow-hidden sm:aspect-auto sm:h-[88%]">
              <img 
                src={it.image}
                alt={it.title}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <div className="flex items-center justify-center p-4 sm:p-5 text-center sm:h-[12%]">
              <span className="text-xs sm:text-sm font-medium text-foreground">{it.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}