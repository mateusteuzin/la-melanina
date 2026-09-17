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
    title: "Modelo Gringo" 
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
            className="group flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-white shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant h-[420px] sm:h-[460px]"
          >
            <div className="relative overflow-hidden h-[93%] rounded-t-2xl sm:rounded-t-3xl">
              <img 
                src={it.image}
                alt={it.title}
                className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.06] scale-[1.04] brightness-[1.02] contrast-[1.08] saturate-[1.1]"
              />
            </div>
            <div className="flex items-center justify-center p-2 sm:p-3 text-center h-[7%]">
              <span className="text-[10px] sm:text-xs font-medium text-foreground/70 tracking-widest uppercase">{it.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}