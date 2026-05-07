import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Benefits } from "@/components/site/Benefits";
import { Booking } from "@/components/site/Booking";
import { Results } from "@/components/site/Results";
import { Testimonials } from "@/components/site/Testimonials";
import { Faq } from "@/components/site/Faq";
import { About } from "@/components/site/About";
import { CtaBand } from "@/components/site/CtaBand";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LA MELANINA — Bronzeamento Natural Premium" },
      { name: "description", content: "Clínica de bronzeamento premium. Realce sua beleza natural com bronze personalizado, atendimento exclusivo e ambiente acolhedor." },
      { property: "og:title", content: "LA MELANINA — Seu bronze, sua melhor versão" },
      { property: "og:description", content: "Bronzeamento natural premium em ambiente sofisticado e acolhedor." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <Booking />
        <Results />
        <Testimonials />
        <Faq />
        <About />
        <CtaBand />
      </main>
      <Footer />
    </div>
  );
}
