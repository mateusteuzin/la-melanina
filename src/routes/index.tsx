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

// Mantém o mesmo conteúdo visual, mas agora como componente React simples (SPA).
export function Index() {
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

