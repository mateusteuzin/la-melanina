import { useMemo, useState, useEffect, useRef } from "react";
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
  AlertCircle,
  CreditCard,
  Wind,
  CheckCircle,
  MoonStar,
  MapPin,
  Leaf,
  Paintbrush,
} from "lucide-react";
import { WhatsappIcon } from "./WhatsappIcon";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwtkX_NJRWbuI9Kc6HaV055BXjViR833HhZQ-6bJVwRrsmJ3Bxg1p_AKRjGYLlDAeSFnw/exec";

type ServiceCategory = "natural" | "cabine" | "clareamento";

type Service = {
  id: string;
  name: string;
  duration: string;
  price: string;
  desc: string;
  Icon: typeof Sun;
  category: ServiceCategory;
};

type AddOn = Omit<Service, "category">;

// BRONZE NATURAL - Períodos
const NATURAL_SERVICES: Service[] = [
  { 
    id: "bronze-turbo",
    name: "Bronze Turbo",
    duration: "período",
    price: "R$ 75,00",
    desc: "Parafina, 2 ativadores e banho de lua clareador.",
    Icon: Sun,
    category: "natural"
  },
  { 
    id: "power", 
    name: "Bronze Power", 
    duration: "período", 
    price: "R$ 80,00", 
    desc: "Giga óleo, 3 ativadores, acelerador e banho de lua clareador.",
    Icon: Flame,
    category: "natural"
  },
  { 
    id: "turbinado", 
    name: "Bronze Turbinado", 
    duration: "período", 
    price: "R$ 85,00", 
    desc: "Giga bronze, 3 ativadores, acelerador, intensificador e banho de lua clareador.",
    Icon: Zap,
    category: "natural"
  },
];

// BRONZE EM CABINE - Horários individuais
const CABINE_SERVICES: Service[] = [
  { 
    id: "solazul", 
    name: "Bronze Sol Azul", 
    duration: "45 min", 
    price: "R$ 120,00", 
    desc: "Ativador, intensificador, fixador, acelerador e banho de lua.",
    Icon: Droplet,
    category: "cabine"
  },
  { 
    id: "solazul-turbo", 
    name: "Bronze Sol Azul Turbo", 
    duration: "45 min", 
    price: "R$ 130,00", 
    desc: "3 ativadores, intensificador, fixador, acelerador e banho de lua.",
    Icon: Sparkles,
    category: "cabine"
  },
  { 
    id: "duplo", 
    name: "Bronze Duplo", 
    duration: "2 horas", 
    price: "R$ 140,00", 
    desc: "Bronze artificial turbo + bronze natural no sol.",
    Icon: Infinity,
    category: "cabine"
  },
];

// CLAREAMENTO - Horários individuais
const CLAREAMENTO_SERVICES: Service[] = [
  {
    id: "clareamento-corporal",
    name: "Clareamento Corporal",
    duration: "horário",
    price: "R$ 35,00",
    desc: "Clareamento para todo o corpo, incluindo o rosto.",
    Icon: MoonStar,
    category: "clareamento"
  },
  {
    id: "banho-lua-clareador",
    name: "Banho de Lua Clareador",
    duration: "horário",
    price: "R$ 75,00",
    desc: "Banho de lua com ação clareadora para realçar a pele e proporcionar um acabamento uniforme e iluminado.",
    Icon: Sparkles,
    category: "clareamento",
  },
];

const ADDITIONAL_SERVICES: AddOn[] = [
  {
    id: "clareamento-area",
    name: "Clareamento de Área",
    duration: "1 região",
    price: "R$ 10,00",
    desc: "Clareamento de apenas uma região: virilha, axila ou outra área específica de sua escolha.",
    Icon: MapPin,
  },
  {
    id: "argiloterapia-facial",
    name: "Argiloterapia Facial",
    duration: "adicional",
    price: "R$ 10,00",
    desc: "Tratamento à base de argila, rica em minerais, com ação antioxidante e antisséptica. Ajuda a desinflamar, remover impurezas e desintoxicar a pele.",
    Icon: Leaf,
  },
  {
    id: "tatuagem-temporaria",
    name: "Tatuagem Temporária",
    duration: "adicional",
    price: "R$ 5,00",
    desc: "Tatuagem não permanente, aplicada com água, ideal para mudar o visual ou testar uma arte sem compromisso.",
    Icon: Paintbrush,
  },
  {
    id: "tattoo-solar",
    name: "Tattoo Solar",
    duration: "adicional",
    price: "R$ 5,00",
    desc: "Feita com adesivo solar para deixar a marquinha da tattoo na pele.",
    Icon: Sun,
  },
  {
    id: "intensificacao-alcinha",
    name: "Intensificação de Alcinha",
    duration: "adicional",
    price: "R$ 15,00",
    desc: "Aplicação de jato na alcinha para deixar a marquinha mais intensa.",
    Icon: Zap,
  },
];

const services: Service[] = [
  ...NATURAL_SERVICES,
  ...CABINE_SERVICES,
  ...CLAREAMENTO_SERVICES,
];

// Períodos para Bronze Natural
const PERIODS = [
  { id: "manha", label: "Manhã", time: "08h às 11h", value: "Manhã (08h-11h)" },
  { id: "tarde", label: "Tarde", time: "15h às 19h", value: "Tarde (15h-19h)" },
];

// Horários individuais para Bronze em Cabine e Clareamento
const TIMES_MANHA = ["08:00", "09:00", "10:00", "11:00"];
const TIMES_TARDE = ["15:00", "16:00", "17:00", "18:00", "19:00"];

const DAYS    = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS  = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const WHATSAPP_NUMBER = "558896241621";

function formatDateBR(date: Date) {
  return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${date.getFullYear()}`;
}

function normalizeTime(value: string) {
  const v = String(value || "").trim();
  if (/^\d:\d{2}$/.test(v)) return `0${v}`;
  if (/^\d{2}:\d{2}$/.test(v)) return v;

  // O Google Sheets devolve células antigas de horário como datas de 1899.
  // Formatar no fuso original recupera 08:00, 09:00 etc. sem exigir
  // que os agendamentos antigos sejam recriados.
  if (/^1899-\d{2}-\d{2}T/.test(v)) {
    const legacyTime = new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(v));

    return legacyTime;
  }

  const isoTime = v.match(/T(\d{2}):(\d{2})/);
  if (isoTime) return `${isoTime[1]}:${isoTime[2]}`;
  return v;
}

function getServiceCategory(serviceId: string): ServiceCategory {
  const service = services.find(s => s.id === serviceId);
  return service?.category || "natural";
}

function priceToNumber(price: string) {
  return Number(price.replace(/[^\d,]/g, "").replace(",", "."));
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Booking() {
  const [serviceId, setServiceId] = useState<string>("bronze-turbo");
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<Date | null>(() => new Date());
  const [time, setTime] = useState<string | null>(null);
  const [period, setPeriod] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [nome, setNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  const [agendamentoConfirmado, setAgendamentoConfirmado] = useState(false);
  const submitRef = useRef(false);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const startOffset = first.getDay();
    const lastDay = new Date(view.y, view.m + 1, 0).getDate();
    const prevLast = new Date(view.y, view.m, 0).getDate();
    const arr: { date: Date; current: boolean; disabled: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      arr.push({ date: new Date(view.y, view.m - 1, prevLast - i), current: false, disabled: true });
    }

    const t0 = new Date(); t0.setHours(0, 0, 0, 0);

    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(view.y, view.m, d);
      arr.push({ date, current: true, disabled: date < t0 || date.getDay() === 1 });
    }

    while (arr.length % 7 !== 0) {
      const d = arr.length - startOffset - lastDay + 1;
      arr.push({ date: new Date(view.y, view.m + 1, d), current: false, disabled: true });
    }

    return arr;
  }, [view]);

  const service = services.find((s) => s.id === serviceId)!;
  const serviceCategory = getServiceCategory(serviceId);
  const isNatural = serviceCategory === "natural";
  const isCabine = serviceCategory === "cabine";
  const isClareamento = serviceCategory === "clareamento";
  const isTimedService = !isNatural;
  const selectedAddOns = ADDITIONAL_SERVICES.filter((addOn) => selectedAddOnIds.includes(addOn.id));
  const totalPrice = formatCurrency(
    priceToNumber(service.price) + selectedAddOns.reduce((total, addOn) => total + priceToNumber(addOn.price), 0),
  );

  const toggleAddOn = (addOnId: string, checked: boolean) => {
    setSelectedAddOnIds((current) =>
      checked ? [...current, addOnId] : current.filter((id) => id !== addOnId),
    );
  };
  
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const selectedDateFormatted = selected ? formatDateBR(selected) : "";
  const summary = selected ? { date: selectedDateFormatted, weekday: WEEKDAYS[selected.getDay()] } : null;

  const normalizeApiDate = (value: unknown) => {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const brDate = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brDate) return raw.slice(0, 10);

    const isoDate = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return isoDate
      ? isoDate[3] + "/" + isoDate[2] + "/" + isoDate[1]
      : raw;
  };

  const fetchAgendamentos = async (dateStr: string) => {
    try {
      const response = await fetch(`${API_URL}?nocache=${Date.now()}`);
      const data = await response.json();
      if (!Array.isArray(data)) { setBookedTimes([]); return []; }
      const horariosOcupados = data
        .filter((item: any) =>
          normalizeApiDate(item.data) === dateStr &&
          String(item.status || "Pendente").toLowerCase() !== "cancelado"
        )
        .map((item: any) => normalizeTime(item.horario));
      setBookedTimes(horariosOcupados);
      if (time && horariosOcupados.includes(normalizeTime(time))) setTime(null);
      return horariosOcupados;
    } catch {
      setBookedTimes([]); return [];
    }
  };

  useEffect(() => {
    if (!selected) return;
    fetchAgendamentos(selectedDateFormatted);
  }, [selectedDateFormatted, serviceId]);

  const buildWhatsappHref = () => {
    const displayTime = isNatural
      ? period
        ? PERIODS.find((p) => p.id === period)?.value
        : null
      : time;
    if (!displayTime || !selected || !summary || !nome.trim()) return "";
    const obs = observacoes.trim();
    const addOnsText = selectedAddOns.length
      ? `\nAdicione também: ${selectedAddOns.map((addOn) => `${addOn.name} (${addOn.price})`).join(", ")}`
      : "";
    const msg = `Olá!\nGostaria de agendar uma sessão de ${service.name} para o dia ${summary.date} às ${displayTime}.${addOnsText}\nValor total: ${totalPrice}\n\nPoderiam confirmar a disponibilidade desse horário?${obs ? `\n\nObservações: ${obs}` : ""}\n\nNome: ${nome.trim()}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const handleBookingClick = async () => {
    if (submitRef.current) return;
    submitRef.current = true;
    const displayTime = isNatural ? (period ? PERIODS.find(p => p.id === period)?.value : null) : time;
    if (!displayTime || !selected || !summary) {
      submitRef.current = false;
      return;
    }
    const horarioNormalizado = normalizeTime(displayTime);

    try {
      const horariosAtualizados = await fetchAgendamentos(summary.date);
      if (horariosAtualizados.includes(horarioNormalizado)) {
        setTime(null);
        submitRef.current = false;
        window.alert("Esse horário acabou de ser ocupado. Escolha outro horário.");
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          servico: [service.name, ...selectedAddOns.map((addOn) => addOn.name)].join(" + "),
          data: summary.date,
          horario: horarioNormalizado,
          nome: nome.trim(),
          observacoes: observacoes.trim(),
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setTime(null);
        submitRef.current = false;
        await fetchAgendamentos(summary.date);
        window.alert(result.error || "Esse horário não está mais disponível.");
        return;
      }

      setAgendamentoConfirmado(true);
      await fetchAgendamentos(summary.date);
    } catch (error) {
      console.error("Erro ao processar agendamento:", error);
      submitRef.current = false;
      window.alert("Não foi possível confirmar o agendamento. Tente novamente.");
      return;
    }

    setTimeout(() => {
      submitRef.current = false;
    }, 3000);
  };

  const stepActive = serviceId ? (selected ? (isNatural ? (period ? 3 : 2) : (time ? 3 : 2)) : 1) : 1;
  const selectedTimeDisplay: string = isNatural 
    ? (period ? (PERIODS.find(p => p.id === period)?.value || "—") : "—") 
    : (time || "—");

  return (
    <section id="agendar" className="bg-secondary/40">
      <div className="container mx-auto px-4 py-14 sm:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-wine md:text-4xl">Agende seu horário</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
            Escolha o serviço ideal e agende sua sessão de forma rápida e prática.
          </p>
        </div>

        <div className="mx-auto mb-8 grid max-w-4xl grid-cols-3 gap-2 sm:gap-4">
          {["Escolha o serviço", "Data e horário", "Confirme"].map((label, i) => {
            const n = i + 1;
            const active = stepActive >= n;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${active ? "bg-wine text-wine-foreground" : "bg-muted text-muted-foreground"}`}>
                  {n}
                </div>
                <span className={`text-xs sm:text-sm font-medium hidden xs:block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* SELEÇÃO DE SERVIÇOS */}
          <div id="servicos" className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft">
            <h3 className="mb-4 text-lg sm:text-xl font-semibold text-wine">1. Escolha o serviço</h3>
            
            {/* Bronze Natural */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Wind className="size-5 text-wine" />
                <h4 className="text-sm font-semibold text-wine uppercase tracking-wide">Bronze Natural</h4>
              </div>
              <div className="space-y-3">
                {NATURAL_SERVICES.map((s) => (
                  <ServiceCard key={s.id} service={s} isSelected={serviceId === s.id} onSelect={() => { setServiceId(s.id); setTime(null); setPeriod(null); }} />
                ))}
              </div>
            </div>

            {/* Separador Visual */}
            <div className="my-4 border-t border-border/50" />

            {/* Bronze em Cabine */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Droplet className="size-5 text-wine" />
                <h4 className="text-sm font-semibold text-wine uppercase tracking-wide">Bronze em Cabine</h4>
              </div>
              <div className="space-y-3">
                {CABINE_SERVICES.map((s) => (
                  <ServiceCard key={s.id} service={s} isSelected={serviceId === s.id} onSelect={() => { setServiceId(s.id); setTime(null); setPeriod(null); }} />
                ))}
              </div>
            </div>

            {/* Separador Visual */}
            <div className="my-4 border-t border-border/50" />

            {/* Clareamento */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <MoonStar className="size-5 text-wine" />
                <h4 className="text-sm font-semibold text-wine uppercase tracking-wide">Clareamento</h4>
              </div>
              <div className="space-y-3">
                {CLAREAMENTO_SERVICES.map((s) => (
                  <ServiceCard key={s.id} service={s} isSelected={serviceId === s.id} onSelect={() => { setServiceId(s.id); setTime(null); setPeriod(null); }} />
                ))}
              </div>
            </div>

            {/* Separador Visual */}
            <div className="my-4 border-t border-border/50" />

            {/* Serviços adicionais combináveis */}
            <div>
              <div className="mb-3 flex items-start gap-3 rounded-2xl bg-accent/35 p-3.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-wine text-wine-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-wine">Adicione também</h4>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    Complete seu atendimento escolhendo um ou mais serviços adicionais.
                  </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {ADDITIONAL_SERVICES.map((addOn) => (
                  <AddOnCard
                    key={addOn.id}
                    addOn={addOn}
                    isSelected={selectedAddOnIds.includes(addOn.id)}
                    onCheckedChange={(checked) => toggleAddOn(addOn.id, checked)}
                  />
                ))}
              </div>
            </div>

            {/* Info Geral */}
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-muted/60 p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>Escolha o serviço desejado, selecione data e horário, e finalize pelo WhatsApp.</span>
            </div>

            {/* Pagamento */}
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3 sm:p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-100">
              <CreditCard className="mt-0.5 size-4 shrink-0" />
              <span><span className="font-semibold">Formas de pagamento:</span> Cartão de crédito, débito e Pix aceitos.</span>
            </div>
          </div>

          {/* DATA E HORÁRIO */}
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft">
            <h3 className="mb-4 text-lg sm:text-xl font-semibold text-wine">2. Escolha a data e horário</h3>
            <div className="rounded-2xl bg-background p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  aria-label="Anterior"
                  className="rounded-full p-2 text-wine hover:bg-muted"
                  onClick={() => setView((v) => v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 })}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <div className="font-semibold text-foreground text-sm sm:text-base">{MONTHS[view.m]} {view.y}</div>
                <button
                  aria-label="Próximo"
                  className="rounded-full p-2 text-wine hover:bg-muted"
                  onClick={() => setView((v) => v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 })}
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] sm:text-xs font-medium text-muted-foreground">
                {DAYS.map((d) => (
                  <div key={d} className="py-1.5">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((c, i) => {
                  const sel = selected && sameDay(c.date, selected);
                  const isMonday = c.current && c.date.getDay() === 1;
                  return (
                    <button
                      key={i}
                      disabled={c.disabled}
                      onClick={() => { setSelected(c.date); setTime(null); setPeriod(null); }}
                      className={`aspect-square rounded-full text-xs sm:text-sm font-medium transition-colors disabled:cursor-not-allowed
                        ${!c.current || c.disabled ? "text-muted-foreground/40 opacity-50" : "text-foreground hover:bg-accent/50"}
                        ${isMonday && c.current ? "opacity-40 hover:bg-transparent" : ""}
                        ${sel ? "bg-wine text-wine-foreground hover:bg-wine" : ""}`}
                    >
                      {c.date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && (
              <>
                <div className="mt-4 text-center text-xs sm:text-sm font-medium text-foreground">
                  {WEEKDAYS[selected.getDay()]}, {selected.getDate()} de {MONTHS[selected.getMonth()]}
                </div>
                {selected.getDay() === 1 ? (
                  <div className="mt-6 text-center text-sm font-medium text-muted-foreground p-4 bg-muted/30 rounded-xl border border-border">
                    Fechado às segundas-feiras
                  </div>
                ) : (
                  <>
                    {/* Avisos específicos por categoria */}
                    {isNatural && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 p-3 text-xs sm:text-sm text-rose-900 dark:text-rose-100">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 flex-shrink-0" />
                        <span><span className="font-semibold">Período flexível:</span> O bronze natural é realizado por período. As clientes são atendidas conforme a organização do espaço.</span>
                      </div>
                    )}
                    {isCabine && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 p-3 text-xs sm:text-sm text-blue-900 dark:text-blue-100">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 flex-shrink-0" />
                        <span><span className="font-semibold">Atendimento em cabine:</span> Tolerância máxima de 10 minutos de atraso. Após esse prazo, o horário poderá ser remarcado conforme disponibilidade.</span>
                      </div>
                    )}
                    {isClareamento && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900/50 p-3 text-xs sm:text-sm text-violet-900 dark:text-violet-100">
                        <AlertCircle className="mt-0.5 size-4 shrink-0 flex-shrink-0" />
                        <span><span className="font-semibold">Clareamento:</span> Escolha um dos horários disponíveis para confirmar seu atendimento.</span>
                      </div>
                    )}
                    {/* Seleção de Períodos (Bronze Natural) */}
                    {isNatural && (
                      <div className="mt-4 space-y-2">
                        {PERIODS.map((p) => {
                          const sel = period === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPeriod(p.id)}
                              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 sm:px-4 sm:py-3 text-left transition-all
                                ${sel
                                  ? "border-wine bg-wine/10 shadow-soft"
                                  : "border-border bg-background text-foreground hover:border-wine/50 hover:bg-muted/30"
                                }`}
                            >
                              <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${sel ? "border-wine bg-wine" : "border-border"}`}>
                                {sel && <span className="size-1.5 rounded-full bg-wine-foreground" />}
                              </span>
                              <div className="flex-1">
                                <div className="font-semibold text-sm sm:text-base text-foreground">{p.label}</div>
                                <div className="text-xs text-muted-foreground">{p.time}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Seleção de Horários (Bronze em Cabine e Banho de Lua) */}
                    {isTimedService && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-foreground mb-2">Manhã</div>
                          <div className="grid grid-cols-4 gap-2">
                            {TIMES_MANHA.map((t) => {
                              const horarioNormalizado = normalizeTime(t);
                              const unavail = bookedTimes.includes(horarioNormalizado);
                              const sel = time === t;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  disabled={unavail}
                                  onClick={() => { if (!unavail) setTime(t); }}
                                  className={`rounded-lg border px-2 py-2 text-xs sm:text-sm font-medium transition-all
                                    ${unavail
                                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60 opacity-70"
                                      : sel
                                        ? "border-wine bg-wine text-wine-foreground shadow-soft"
                                        : "border-border bg-background text-foreground hover:border-wine/50"
                                    }`}
                                >
                                  {t}
                                  {unavail && <div className="text-[9px]">Indisponível</div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground mb-2">Tarde</div>
                          <div className="grid grid-cols-4 gap-2">
                            {TIMES_TARDE.map((t) => {
                              const horarioNormalizado = normalizeTime(t);
                              const unavail = bookedTimes.includes(horarioNormalizado);
                              const sel = time === t;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  disabled={unavail}
                                  onClick={() => { if (!unavail) setTime(t); }}
                                  className={`rounded-lg border px-2 py-2 text-xs sm:text-sm font-medium transition-all
                                    ${unavail
                                      ? "cursor-not-allowed border-border bg-muted text-muted-foreground/60 opacity-70"
                                      : sel
                                        ? "border-wine bg-wine text-wine-foreground shadow-soft"
                                        : "border-border bg-background text-foreground hover:border-wine/50"
                                    }`}
                                >
                                  {t}
                                  {unavail && <div className="text-[9px]">Indisponível</div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Como funciona */}
          <div className="rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft">
            <h3 className="mb-4 text-lg sm:text-xl font-semibold text-wine">Como funciona o agendamento</h3>
            <ol className="space-y-4">
              {["Escolha o serviço", "Escolha a data e horário", "Confirme no WhatsApp"].map((t, i) => (
                <li key={t} className="flex gap-3 sm:gap-4">
                  <div className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full bg-wine text-sm font-semibold text-wine-foreground">{i + 1}</div>
                  <div>
                    <div className="font-semibold text-foreground text-sm sm:text-base">{t}</div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {i === 0
                        ? "Selecione o serviço principal e, se quiser, marque opções em Adicione também."
                        : i === 1
                          ? "Veja os horários disponíveis e escolha o melhor para você."
                          : "Você será direcionada para o WhatsApp com todos os detalhes do agendamento."}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Confirmação */}
          <div className="rounded-3xl border border-border bg-accent/30 p-4 sm:p-6 shadow-soft">
            <h3 className="mb-4 text-lg sm:text-xl font-semibold text-wine">3. Confirme seu agendamento</h3>
            <div className="mx-auto flex size-12 sm:size-14 animate-float items-center justify-center rounded-full bg-wine text-wine-foreground shadow-glow">
              <Send className="size-5 sm:size-6" />
            </div>
            <p className="mt-3 text-center font-semibold text-foreground text-sm sm:text-base">Pronto para agendar!</p>
            <p className="mt-1 text-center text-xs sm:text-sm text-muted-foreground">
              Você será direcionada ao WhatsApp com os detalhes do seu agendamento.
            </p>

            {/* Resumo */}
            <div className="mt-4 space-y-2 rounded-2xl border border-border bg-card p-3 sm:p-4 text-sm">
              <Row icon={<Sun className="size-4" />} label="Serviço" value={service.name} />
              {selectedAddOns.map((addOn) => (
                <Row key={addOn.id} icon={<Sparkles className="size-4" />} label="Adicional" value={`${addOn.name} — ${addOn.price}`} />
              ))}
              <Row icon={<Calendar className="size-4" />} label="Data" value={summary ? `${summary.date} (${summary.weekday})` : "—"} />
              <Row icon={<Clock className="size-4" />} label={isNatural ? "Período" : "Horário"} value={selectedTimeDisplay} />
              <div className="border-t border-border pt-2 mt-2">
                <Row icon={<CreditCard className="size-4" />} label="Valor total" value={totalPrice} />
              </div>
              {isCabine && (
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="size-3 mt-0.5 shrink-0 flex-shrink-0" />
                    <span>Tolerância máxima: 10 minutos de atraso.</span>
                  </p>
                </div>
              )}
            </div>

            {/* Inputs */}
            <div className={`mt-3 space-y-2 transition-all ${(isNatural ? period : time) ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <Input
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-background text-sm"
              />
              <Input
                placeholder="Observações (Opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="bg-background text-sm"
              />
            </div>

            {/* Botão WhatsApp */}
            {(() => {
              const href = buildWhatsappHref();
              const canBook = !!(((isNatural ? period : time) && nome.trim() && href));
              

              return canBook ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleBookingClick}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-wine px-6 py-3 text-sm font-semibold text-wine-foreground shadow-elegant transition-all hover:bg-wine/90"
                >
                  <WhatsappIcon className="size-5" /> AGENDAR PELO WHATSAPP
                </a>
              ) : (
                <span className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-wine/50 px-6 py-3 text-sm font-semibold text-wine-foreground shadow-elegant opacity-60">
                  <WhatsappIcon className="size-5" /> AGENDAR PELO WHATSAPP
                </span>
              );
            })()}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Ao clicar, você será redirecionada para o WhatsApp para finalizar seu agendamento.
            </p>

            {/* Confirmação de Agendamento */}
            {agendamentoConfirmado && (
              <div className="mt-4 p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 dark:text-green-100 text-sm">Agendamento recebido! ✨</p>
                    <p className="text-xs text-green-800 dark:text-green-200 mt-1">Você será direcionada ao WhatsApp para finalizar.</p>
                    
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AddOnCard({
  addOn,
  isSelected,
  onCheckedChange,
}: {
  addOn: AddOn;
  isSelected: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const Icon = addOn.Icon;

  return (
    <label
      htmlFor={`add-on-${addOn.id}`}
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 transition-all ${
        isSelected
          ? "border-wine bg-wine/5 shadow-soft"
          : "border-border bg-background hover:border-wine/40 hover:bg-muted/40"
      }`}
    >
      <Checkbox
        id={`add-on-${addOn.id}`}
        checked={isSelected}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        aria-label={`Adicionar ${addOn.name}`}
        className="mt-1 size-5 rounded-md"
      />
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/65 text-wine">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold leading-tight text-foreground">{addOn.name}</span>
          <span className="shrink-0 text-sm font-bold text-wine">+ {addOn.price}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{addOn.desc}</p>
        {isSelected && (
          <span className="mt-2 inline-flex rounded-full bg-wine px-2 py-0.5 text-[10px] font-semibold text-wine-foreground">
            Adicionado
          </span>
        )}
      </div>
    </label>
  );
}

// Componente para Card de Serviço
function ServiceCard({ service, isSelected, onSelect }: { service: Service; isSelected: boolean; onSelect: () => void }) {
  const Icon = service.Icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 sm:p-4 text-left transition-all ${isSelected ? "border-wine bg-wine/5 shadow-soft" : "border-border hover:border-wine/40 hover:bg-muted/50"}`}
    >
      <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? "border-wine bg-wine" : "border-border"}`}>
        {isSelected && <span className="size-1.5 rounded-full bg-wine-foreground" />}
      </span>
      <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-xl bg-accent text-wine">
        <Icon className="size-5 sm:size-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold text-foreground text-sm sm:text-base truncate">{service.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{service.duration}</span>
        </div>
        <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{service.desc}</p>
        <div className="mt-1 font-semibold text-wine text-sm">{service.price}</div>
      </div>
    </button>
  );
}

// Componente para Linha de Resumo
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-wine">{icon}</span>
      <span className="font-medium text-foreground text-xs sm:text-sm">{label}:</span>
      <span className="text-muted-foreground text-xs sm:text-sm">{value}</span>
    </div>
  );
}
