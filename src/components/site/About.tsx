import { Sparkles, ShieldCheck, Award, HandHeart } from "lucide-react";
import about from "@/assets/about.jpg";
import { useInView } from "@/hooks/useInView";

const pillars = [
  { Icon: Sparkles, t: "Bronzeamento Personalizado" },
  { Icon: ShieldCheck, t: "Produtos Premium e Seguros" },
  { Icon: Award, t: "Tecnologia e Qualidade" },
  { Icon: HandHeart, t: "Cuidado que Transforma" },
];

export function About() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as any} id="sobre" className={`bg-secondary/30 py-14 sm:py-20 section-hidden ${inView ? "section-visible" : ""}`}>
      <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-2 lg:items-center lg:gap-10">
        <img src={about} alt="LA MELANINA studio" loading="lazy" width={1280} height={960} className="rounded-3xl object-cover shadow-elegant aspect-[4/3] w-full order-1 lg:order-2" />
        <div className="order-2 lg:order-1">
          <h2 className="mb-4 text-3xl font-bold text-wine md:text-4xl">Sobre a LA MELANINA</h2>
          <p className="text-foreground/75 text-sm sm:text-base leading-relaxed">
            A LA MELANINA nasceu para valorizar a beleza natural de cada mulher, oferecendo bronzeamento personalizado, atendimento cuidadoso e um ambiente pensado para autoestima, conforto e bem-estar.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {pillars.map(({ Icon, t }) => (
              <div key={t} className="text-center">
                <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent text-wine">
                  <Icon className="size-5" />
                </div>
                <div className="text-xs font-medium text-foreground leading-snug">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
