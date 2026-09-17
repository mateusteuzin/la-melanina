import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import faqImg from "@/assets/la melanina estudio2.png";
import { useInView } from "@/hooks/useInView";

const faqs = [
  { q: "Quanto tempo dura o bronze?", a: "A duração média do bronze é de 30 dias, dependendo dos cuidados com a pele e do tipo de serviço escolhido." },
  { q: "O bronzeamento mancha?", a: "Não. Utilizamos técnica e produtos premium que garantem cor uniforme, sem manchas." },
  { q: "Preciso preparar a pele antes?", a: "Sim. Recomendamos esfoliação 24h antes da sessão e hidratação diária." },
  { q: "Posso tomar banho depois?", a: "Sim, após o tempo recomendado pela profissional, geralmente entre 4h e 8h." },
  { q: "Como faço o agendamento?", a: "É só escolher o serviço, data e horário acima e finalizar pelo WhatsApp." },
];

export function Faq() {
  const { ref, inView } = useInView();
  return (
    <section ref={ref as React.RefObject<HTMLElement>} id="duvidas" className={`container mx-auto grid gap-8 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:items-stretch lg:gap-10 section-hidden ${inView ? "section-visible" : ""}`}>
      <div className="order-2 lg:order-1 flex flex-col justify-center">
        <h2 className="mb-6 text-3xl font-bold text-wine md:text-4xl">Dúvidas frequentes</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`i${i}`} className="rounded-2xl border border-border bg-card px-4 sm:px-5 shadow-soft">
              <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <div className="order-1 lg:order-2 flex h-full min-h-[300px]">
        <img src={faqImg} alt="Ambiente da clínica LA MELANINA" loading="lazy" className="rounded-3xl object-cover object-center shadow-elegant w-full h-full aspect-[4/3] lg:aspect-auto" />
      </div>
    </section>
  );
}
