import { useState } from "react";
import { Check, Clock3, Heart, ShieldCheck, SunMedium } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function BookingPolicyModal() {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-lg gap-0 overflow-y-auto rounded-[1.75rem] border-wine/10 bg-card p-0 shadow-elegant sm:rounded-[2rem] [&>button]:right-5 [&>button]:top-5 [&>button]:rounded-full [&>button]:bg-white/70 [&>button]:p-2 [&>button]:text-wine [&>button]:opacity-100 [&>button]:shadow-sm [&>button]:backdrop-blur-sm">
        <div className="relative overflow-hidden bg-accent/55 px-6 pb-7 pt-8 sm:px-9 sm:pb-8 sm:pt-9">
          <div className="absolute -right-12 -top-14 size-40 rounded-full border-[28px] border-white/35" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-10 size-32 rounded-full bg-white/30" aria-hidden="true" />

          <div className="relative flex items-start gap-4 pr-9">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-wine text-wine-foreground shadow-lg shadow-wine/15">
              <SunMedium className="size-6" strokeWidth={1.8} />
            </div>
            <div>
              <span className="inline-flex rounded-full border border-wine/10 bg-white/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-wine">
                Comunicado importante
              </span>
              <DialogTitle className="mt-3 font-serif text-2xl font-semibold leading-tight text-wine sm:text-[1.75rem]">
                Nosso compromisso com o seu horário
              </DialogTitle>
            </div>
          </div>

          <DialogDescription className="relative mt-4 max-w-md text-sm leading-relaxed text-foreground/70">
            Para manter uma experiência tranquila e organizada para todas, preparamos uma política de agendamento simples e transparente.
          </DialogDescription>
        </div>

        <div className="px-6 py-6 sm:px-9 sm:py-7">
          <div className="space-y-3">
            <div className="flex gap-3.5 rounded-2xl border border-border/80 bg-background/70 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wine/8 text-wine">
                <Clock3 className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Cancelamentos e reagendamentos</h3>
                  <span className="rounded-full bg-accent/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-wine">24 horas</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Solicite qualquer alteração com, no mínimo, 24 horas de antecedência.
                </p>
              </div>
            </div>

            <div className="flex gap-3.5 rounded-2xl border border-border/80 bg-background/70 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wine/8 text-wine">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Reserva protegida</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Em solicitações feitas com menos de 24 horas, o depósito não será reembolsado, pois garante a exclusividade do horário reservado.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-border/70 pt-5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/60 text-wine">
              <Heart className="size-4 fill-current" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Obrigada pela compreensão e por confiar no nosso trabalho.<br />
              <span className="font-semibold text-wine">Com carinho, La Melanina.</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-wine px-5 py-3.5 text-sm font-semibold text-wine-foreground shadow-lg shadow-wine/15 transition-all hover:-translate-y-0.5 hover:bg-wine/92 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine focus-visible:ring-offset-2 active:translate-y-0"
          >
            <Check className="size-4" />
            Li e estou de acordo
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
