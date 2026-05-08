import r1 from "@/assets/result1.jpg";
import r2 from "@/assets/result2.jpg";
import r3 from "@/assets/result3.jpg";
import r4 from "@/assets/result4.jpg";
import { Sun, Sparkles, Droplet } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const items = [
  { src: r1, label: "Bronze Natural", Icon: Sun },
  { src: r2, label: "Resultado Uniforme", Icon: Sparkles },
  { src: r3, label: "Pele Iluminada", Icon: Droplet },
  { src: r4, label: "Bronze Duradouro", Icon: Sun },
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
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="group overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant">
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src={it.src} alt={it.label} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-x-2 bottom-2 flex justify-between text-[10px] sm:text-xs font-semibold text-wine">
                <span className="rounded-full bg-background/85 px-2 py-0.5 sm:px-3 sm:py-1">Antes</span>
                <span className="rounded-full bg-background/85 px-2 py-0.5 sm:px-3 sm:py-1">Depois</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 sm:p-4">
              <it.Icon className="size-4 text-bronze shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-foreground">{it.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
