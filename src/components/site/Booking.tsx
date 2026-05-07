import { useMemo, useState, useEffect } from "react";
import {
  Sun,
  Sparkles,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Info,
  Send,
  Flame,
  Zap,
  Infinity,
} from "lucide-react";
import { WhatsappIcon } from "./WhatsappIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzL1AmdqbO1WprMTL5nZYj98AtMNwF9nQqtETbq0Kppo_Spje7ckQO9z5Bq8XFWNIgX5g/exec";

type Service = {
  id: string;
  name: string;
  duration: string;
  price: string;
  desc: string;
  Icon: typeof Sun;
};

const services: Service[] = [
  {
    id: "praiano",
    name: "Praiano",
    duration: "2 horas",
    price: "R$ 70,00",
    desc: "Parafina, 2 ativadores e banho de lua clareador.",
    Icon: Sun,
  },
  {
    id: "hipersonico",
    name: "Hipersônico",
    duration: "2 horas",
    price: "R$ 80,00",
    desc: "Giga óleo, 3 ativadores, acelerador e banho de lua clareador.",
    Icon: Flame,
  },
  {
    id: "turbo-neon",
    name: "Turbo Neon",
    duration: "2 horas",
    price: "R$ 85,00",
    desc: "Giga bronze, 3 ativadores, acelerador, intensificador e banho de lua clareador.",
    Icon: Zap,
  },
  {
    id: "praiano-cabine",
    name: "Praiano Bronze Artificial",
    duration: "45 min",
    price: "R$ 120,00",
    desc: "Ativador, intensificador, fixador, acelerador e banho de lua.",
    Icon: Droplet,
  },
  {
    id: "turbo-cabine",
    name: "Turbo Bronze Artificial",
    duration: "45 min",
    price: "R$ 130,00",
    desc: "3 ativadores, intensificador, fixador, acelerador e banho de lua.",
    Icon: Sparkles,
  },
  {
    id: "bronze-duplo",
    name: "Bronze Duplo",
    duration: "2 horas",
    price: "R$ 145,00",
    desc: "Bronze artificial turbo + bronze natural no sol.",
    Icon: Infinity,
  },
];

const TIMES_NATURAL = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

const TIMES_CABINE = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
];

const DAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const WHATSAPP_NUMBER = "558896241621";

function formatDateBR(date: Date) {
  return `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

function normalizeTime(value: string) {
  const v = String(value || "").trim();

  if (/^\d:\d{2}$/.test(v)) {
    return `0${v}`;
  }

  return v;
}

export function Booking() {
  const [serviceId, setServiceId] = useState<string>("praiano");
  const today = new Date();

  const [view, setView] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
  });

  const [selected, setSelected] = useState<Date | null>(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 2);
    return d;
  });

  const [time, setTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const startOffset = first.getDay();
    const lastDay = new Date(view.y, view.m + 1, 0).getDate();
    const prevLast = new Date(view.y, view.m, 0).getDate();

    const arr: { date: Date; current: boolean; disabled: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      arr.push({
        date: new Date(view.y, view.m - 1, prevLast - i),
        current: false,
        disabled: true,
      });
    }

    const t0 = new Date();
    t0.setHours(0, 0, 0, 0);

    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(view.y, view.m, d);

      arr.push({
        date,
        current: true,
        disabled: date < t0,
      });
    }

    while (arr.length % 7 !== 0) {
      const d = arr.length - startOffset - lastDay + 1;

      arr.push({
        date: new Date(view.y, view.m + 1, d),
        current: false,
        disabled: true,
      });
    }

    return arr;
  }, [view]);

  const service = services.find((s) => s.id === serviceId)!;

  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  const selectedDateFormatted = selected ? formatDateBR(selected) : "";

  const summary =
    selected && time
      ? {
        date: selectedDateFormatted,
        weekday: WEEKDAYS[selected.getDay()],
      }
      : null;

  const fetchAgendamentos = async (dateStr: string) => {
    try {
      const response = await fetch(`${API_URL}?nocache=${Date.now()}`);
      const data = await response.json();

      console.log("AGENDAMENTOS:", data);

      if (!Array.isArray(data)) {
        setBookedTimes([]);
        return [];
      }

      const horariosOcupados = data
        .filter((item: any) => {
          const dataItem = String(item.data || "").trim();
          return dataItem === dateStr;
        })
        .map((item: any) => normalizeTime(item.horario));

      console.log("HORÁRIOS OCUPADOS:", horariosOcupados);

      setBookedTimes(horariosOcupados);

      if (time && horariosOcupados.includes(normalizeTime(time))) {
        setTime(null);
      }

      return horariosOcupados;
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      setBookedTimes([]);
      return [];
    }
  };

  useEffect(() => {
    if (!selected) return;

    fetchAgendamentos(selectedDateFormatted);
  }, [selectedDateFormatted, serviceId]);

  const handleSchedule = async () => {
    if (!time || !selected || !summary) return;

    if (!nome.trim() || !telefone.trim()) {
      alert("Por favor, preencha seu nome e telefone antes de continuar.");
      return;
    }

    const horarioNormalizado = normalizeTime(time);

    if (bookedTimes.includes(horarioNormalizado)) {
      alert("Esse horário não está mais disponível. Escolha outro horário.");
      setTime(null);
      await fetchAgendamentos(summary.date);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          servico: service.name,
          data: summary.date,
          horario: horarioNormalizado,
          nome: nome.trim(),
          telefone: telefone.trim(),
        }),
      });

      const result = await res.json();

      if (result.success === false) {
        alert("Esse horário não está mais disponível. Escolha outro horário.");
        setTime(null);
        await fetchAgendamentos(summary.date);
        return;
      }

      await fetchAgendamentos(summary.date);

      const msg = `Olá, gostaria de agendar ${service.name} para o dia ${summary.date} às ${horarioNormalizado}. Meu nome é ${nome.trim()} e meu telefone é ${telefone.trim()}.`;
      const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        msg
      )}`;

      setTime(null);
      // Abrir diretamente o link (sem window.open) para evitar bloqueio no Safari/estouro de pop-up
      window.location.assign(href);
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepActive = serviceId ? (selected ? (time ? 3 : 2) : 1) : 1;

  const currentTimes = ["praiano-cabine", "turbo-cabine", "bronze-duplo"].includes(
    serviceId
  )
    ? TIMES_CABINE
    : TIMES_NATURAL;

  return (
    <section id="agendar" className="bg-secondary/40">

      <div className="container mx-auto px-4 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-wine md:text-4xl">
            Agende seu horário
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Escolha o serviço ideal e agende sua sessão de forma rápida e
            prática.
          </p>
        </div>

        <div className="mx-auto mb-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            "Escolha o serviço",
            "Escolha a data e horário",
            "Confirme seu agendamento",
          ].map((label, i) => {
            const n = i + 1;
            const active = stepActive >= n;

            return (
              <div key={label} className="flex items-center gap-3">
                <div
                  className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${active
                    ? "bg-wine text-wine-foreground"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  {n}
                </div>

                <span
                  className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"
                    }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div
            id="servicos"
            className="rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <h3 className="mb-5 text-xl font-semibold text-wine">
              1. Escolha o serviço
            </h3>

            <div className="space-y-4">
              {services.map((s) => {
                const sel = serviceId === s.id;
                const Icon = s.Icon;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      setTime(null);
                    }}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${sel
                      ? "border-wine bg-wine/5 shadow-soft"
                      : "border-border hover:border-wine/40 hover:bg-muted/50"
                      }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${sel ? "border-wine bg-wine" : "border-border"
                        }`}
                    >
                      {sel && (
                        <span className="size-2 rounded-full bg-wine-foreground" />
                      )}
                    </span>

                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-accent text-wine">
                      <Icon className="size-7" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {s.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {s.duration}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {s.desc}
                      </p>

                      <div className="mt-2 font-semibold text-wine">
                        {s.price}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                Todos os serviços incluem preparo de pele e finalização
                hidratante.
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-5 text-xl font-semibold text-wine">
              2. Escolha a data e horário
            </h3>

            <div className="rounded-2xl bg-background p-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  aria-label="Anterior"
                  className="rounded-full p-2 text-wine hover:bg-muted"
                  onClick={() =>
                    setView((v) =>
                      v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }
                    )
                  }
                >
                  <ChevronLeft className="size-5" />
                </button>

                <div className="font-semibold text-foreground">
                  {MONTHS[view.m]} {view.y}
                </div>

                <button
                  aria-label="Próximo"
                  className="rounded-full p-2 text-wine hover:bg-muted"
                  onClick={() =>
                    setView((v) =>
                      v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }
                    )
                  }
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {DAYS.map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) => {
                  const sel = selected && sameDay(c.date, selected);

                  return (
                    <button
                      key={i}
                      disabled={c.disabled}
                      onClick={() => {
                        setSelected(c.date);
                        setTime(null);
                      }}
                      className={`aspect-square rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed
                        ${!c.current || c.disabled
                          ? "text-muted-foreground/40"
                          : "text-foreground hover:bg-accent/50"
                        }
                        ${sel
                          ? "bg-wine text-wine-foreground hover:bg-wine"
                          : ""
                        }`}
                    >
                      {c.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && (
              <>
                <div className="mt-5 text-center text-sm font-medium text-foreground">
                  {WEEKDAYS[selected.getDay()]}, {selected.getDate()} de{" "}
                  {MONTHS[selected.getMonth()]}
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {currentTimes.map((t) => {
                    const horarioNormalizado = normalizeTime(t);
                    const unavail = bookedTimes.includes(horarioNormalizado);
                    const sel = time === t;

                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={unavail}
                        onClick={() => {
                          if (unavail) return;
                          setTime(t);
                        }}
                        className={`rounded-xl border px-2 py-2 text-sm font-medium transition-all
                          ${unavail
                            ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60 opacity-70"
                            : sel
                              ? "border-wine bg-wine text-wine-foreground shadow-soft"
                              : "border-border bg-background text-foreground hover:border-wine/50"
                          }`}
                      >
                        <div>{t}</div>
                        {unavail && (
                          <div className="text-[10px] uppercase">
                            Indisponível
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h3 className="mb-5 text-xl font-semibold text-wine">
              Como funciona o agendamento
            </h3>

            <ol className="space-y-5">
              {[
                "Escolha o serviço",
                "Escolha a data e horário",
                "Confirme no WhatsApp",
              ].map((t, i) => (
                <li key={t} className="flex gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-wine text-sm font-semibold text-wine-foreground">
                    {i + 1}
                  </div>

                  <div>
                    <div className="font-semibold text-foreground">{t}</div>

                    <p className="text-sm text-muted-foreground">
                      {i === 0
                        ? "Selecione o bronze ideal para você e suas necessidades."
                        : i === 1
                          ? "Veja os horários disponíveis e escolha o melhor para você."
                          : "Você será direcionada para o WhatsApp com todos os detalhes do agendamento."}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-border bg-accent/30 p-6 shadow-soft">
            <h3 className="mb-5 text-xl font-semibold text-wine">
              3. Confirme seu agendamento
            </h3>

            <div className="mx-auto flex size-14 animate-float items-center justify-center rounded-full bg-wine text-wine-foreground shadow-glow">
              <Send className="size-6" />
            </div>

            <p className="mt-4 text-center font-semibold text-foreground">
              Pronto para agendar!
            </p>

            <p className="mt-1 text-center text-sm text-muted-foreground">
              Você será direcionada ao WhatsApp com os detalhes do seu
              agendamento.
            </p>

            <div className="mt-5 space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
              <Row icon={<Sun className="size-4" />} label="Serviço" value={service.name} />

              <Row
                icon={<Calendar className="size-4" />}
                label="Data"
                value={summary ? `${summary.date} (${summary.weekday})` : "—"}
              />

              <Row
                icon={<Clock className="size-4" />}
                label="Horário"
                value={time ?? "—"}
              />
            </div>

            <div
              className={`mt-4 space-y-3 transition-all ${time ? "opacity-100" : "opacity-50 pointer-events-none"
                }`}
            >
              <Input
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-background"
              />

              <Input
                placeholder="Seu telefone/WhatsApp"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="bg-background"
              />
            </div>

            <Button
              onClick={handleSchedule}
              size="lg"
              disabled={!time || !nome || !telefone || isSubmitting}
              className="mt-5 w-full rounded-full bg-wine text-wine-foreground hover:bg-wine/90 shadow-elegant transition-all"
            >
              {isSubmitting ? (
                "AGUARDANDO..."
              ) : (
                <>
                  <WhatsappIcon className="size-5" /> AGENDAR PELO WHATSAPP
                </>
              )}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ao clicar, você será redirecionada para o WhatsApp para finalizar
              seu agendamento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-wine">{icon}</span>
      <span className="font-medium text-foreground">{label}:</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}