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
      <div className="container mx-auto grid gap-5 sm:gap-8 px-6 lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-4">
        <img
          src={about}
          alt="LA MELANINA studio"
          loading="lazy"
          width={1280}
          height={960}
          className="rounded-3xl object-cover object-[center_15%] shadow-elegant aspect-[4/3] w-full order-1 lg:order-2"
        />
        <div className="order-2 lg:order-1 text-center lg:text-left">
          <h2 className="mb-2 sm:mb-4 text-2xl sm:text-3xl md:text-4xl font-bold text-wine">Sobre a LA MELANINA</h2>
          <p className="text-foreground/75 text-[17px] sm:text-base leading-[1.65] max-w-[320px] sm:max-w-none mx-auto lg:mx-0">
            Há 6 anos no mercado do bronze, a LA MELANINA nasceu com o propósito de valorizar a beleza natural de cada mulher. Unimos tecnologia e produtos premium a um atendimento baseado no cuidado genuíno, oferecendo uma experiência de bronzeamento personalizada que transforma a autoestima e garante o seu bem-estar.
          </p>
          <h3 className="mt-4 sm:mt-6 mb-3 sm:mb-4 text-lg sm:text-xl md:text-2xl font-bold text-wine">Nossos Pilares</h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-4 sm:grid-cols-4 max-w-[320px] sm:max-w-none mx-auto">
            {pillars.map(({ Icon, t, desc }) => (
              <div key={t} className="text-center">
                <div className="mx-auto mb-1.5 flex size-9 sm:size-11 items-center justify-center rounded-2xl bg-accent text-wine">
                  <Icon className="size-4 sm:size-5" />
                </div>
                <div className="text-[11px] sm:text-xs font-medium text-foreground leading-snug">{t}</div>
                <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground leading-tight">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}