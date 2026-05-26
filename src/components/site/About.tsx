import { Sparkles, ShieldCheck, Award, HandHeart } from "lucide-react";
import about from "@/assets/mayara preto2.png";
import { useInView } from "@/hooks/useInView";

const pillars = [
  { Icon: Sparkles, t: "Bronzeamento Personalizado", desc: "O tom perfeito e exclusivo para você." },
  { Icon: ShieldCheck, t: "Produtos Premium e Seguros", desc: "Cuidado e proteção para a sua pele." },
  { Icon: Award, t: "Tecnologia e Qualidade", desc: "Resultados impecáveis e duradouros." },
  { Icon: HandHeart, t: "Cuidado que Transforma", desc: "Um ambiente pensado para o seu conforto." },
];

export function About() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as any} id="sobre" className={`bg-secondary/30 py-14 sm:py-20 section-hidden ${inView ? "section-visible" : ""}`}>
      <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-2 lg:items-center lg:gap-10">
        <img src={about} alt="LA MELANINA studio" loading="lazy" width={1280} height={960} className="rounded-3xl object-cover object-[center_15%] shadow-elegant aspect-[4/3] w-full order-1 lg:order-2" />
        <div className="order-2 lg:order-1">
          <h2 className="mb-4 text-3xl font-bold text-wine md:text-4xl">Sobre a LA MELANINA</h2>
          <p className="text-foreground/75 text-sm sm:text-base leading-relaxed">
            Há 6 anos no mercado do bronze, a LA MELANINA nasceu com o propósito de valorizar a beleza natural de cada mulher. Unimos tecnologia e produtos premium a um atendimento baseado no cuidado genuíno, oferecendo uma experiência de bronzeamento personalizada que transforma a autoestima e garante o seu bem-estar.
          </p>
          <h3 className="mt-6 mb-4 text-xl font-bold text-wine md:text-2xl">Nossos Pilares</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {pillars.map(({ Icon, t, desc }) => (
              <div key={t} className="text-center">
                <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent text-wine">
                  <Icon className="size-5" />
                </div>
                <div className="text-xs font-medium text-foreground leading-snug">{t}</div>
                <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
