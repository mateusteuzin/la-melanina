import { Sparkles, ShieldCheck, Award, HandHeart } from "lucide-react";
import about from "@/assets/about.jpg";

const pillars = [
  { Icon: Sparkles, t: "Bronzeamento Personalizado" },
  { Icon: ShieldCheck, t: "Produtos Premium e Seguros" },
  { Icon: Award, t: "Tecnologia e Qualidade" },
  { Icon: HandHeart, t: "Cuidado que Transforma" },
];

export function About() {
  return (
    <section id="sobre" className="bg-secondary/30 py-20">
      <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="mb-5 text-3xl font-bold text-wine md:text-4xl">Sobre a LA MELANINA</h2>
          <p className="text-foreground/75">
            A LA MELANINA nasceu para valorizar a beleza natural de cada mulher, oferecendo bronzeamento personalizado, atendimento cuidadoso e um ambiente pensado para autoestima, conforto e bem-estar.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {pillars.map(({ Icon, t }) => (
              <div key={t} className="text-center">
                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-accent text-wine">
                  <Icon className="size-5" />
                </div>
                <div className="text-xs font-medium text-foreground">{t}</div>
              </div>
            ))}
          </div>
        </div>
        <img src={about} alt="LA MELANINA studio" loading="lazy" width={1280} height={960} className="rounded-3xl object-cover shadow-elegant aspect-[4/3] w-full" />
      </div>
    </section>
  );
}
