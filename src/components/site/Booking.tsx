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
import { loadCatalog, unavailable, createBooking, demoMode } from '@/admin/store';
import { naturalTimes } from '@/admin/domain';
import type { Service as CatalogService, Addon as CatalogAddon } from '@/admin/domain';

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
    duration: "horário de chegada",
    price: "R$ 75,00",
    desc: "Parafina, 2 ativadores e banho de lua clareador.",
    Icon: Sun,
    category: "natural"
  },
  {
    id: "power",
    name: "Bronze Power",
    duration: "horário de chegada",
    price: "R$ 80,00",
    desc: "Giga óleo, 3 ativadores, acelerador e banho de lua clareador.",
    Icon: Flame,
    category: "natural"
  },
  {
    id: "turbinado",
    name: "Bronze Turbinado",
    duration: "horário de chegada",
    price: "R$ 85,00",
    desc: "Giga bronze, 3 ativadores, acelerador, intensificador e banho de lua clareador.",
    Icon: Zap,
    category: "natural"
  },
  {
    id: "diamante-premium",
    name: "Bronze Diamante Premium",
    duration: "horário de chegada",
    price: "R$ 85,00",
    desc: "Ativador diamante premium, acelerador, intensificador, fixador e banho de lua clareador.",
    Icon: Sparkles,
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
    price: "R$ 145,00",
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
    price: "R$ 40,00",
    desc: "Clareamento de 4 áreas do corpo e rosto.",
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
  const [catalog, setCatalog] = useState<{services:CatalogService[];addons:CatalogAddon[]}|null>(null);
  const [bookingError, setBookingError] = useState('');
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedWhatsappHref, setConfirmedWhatsappHref] = useState('');
  const [telefone, setTelefone] = useState('');
  const catalogServices:Service[] = (catalog?.services || []).filter(s=>s.active).map(s=>({ ...s, price:formatCurrency(s.price), duration:s.category==='natural'?'horário de chegada':`${s.duration} min`, Icon:s.category==='natural'?Sun:s.category==='cabine'?Droplet:Sparkles }));
  const services = catalogServices.length ? catalogServices : [...NATURAL_SERVICES,...CABINE_SERVICES,...CLAREAMENTO_SERVICES];
  const naturalServices = catalogServices.filter(s=>s.category==='natural');
  const cabineServices = catalogServices.filter(s=>s.category==='cabine');
  const clareamentoServices = catalogServices.filter(s=>s.category==='clareamento');
  const additionalServices:AddOn[] = (catalog?.addons||[]).map(a=>({...a,price:formatCurrency(a.price),duration:'adicional',desc:ADDITIONAL_SERVICES.find(x=>x.id===a.id)?.desc||'',Icon:ADDITIONAL_SERVICES.find(x=>x.id===a.id)?.Icon||Sparkles}));
  useEffect(()=>{const refresh=()=>loadCatalog().then(setCatalog).catch(e=>setBookingError(e.message));refresh();const interval=setInterval(refresh,30000);window.addEventListener('storage',refresh);window.addEventListener('melanina-change',refresh);return()=>{clearInterval(interval);window.removeEventListener('storage',refresh);window.removeEventListener('melanina-change',refresh);};},[]);
  const [mobileStep, setMobileStep] = useState<1 | 2 | 3>(1);
  const progressRef = useRef<HTMLParagraphElement>(null);
  const goToStep = (step: 1 | 2 | 3) => {
    setMobileStep(step);
    requestAnimationFrame(() => {
      progressRef.current?.focus({ preventScroll: true });
      progressRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  useEffect(() => {
    const showServices = () => {
      if (window.location.hash === "#servicos") {
        setMobileStep(1);
        requestAnimationFrame(() => document.getElementById("servicos")?.scrollIntoView({ block: "start" }));
      }
    };
    window.addEventListener("hashchange", showServices);
    return () => window.removeEventListener("hashchange", showServices);
  }, []);
  const [serviceId, setServiceId] = useState<string>("bronze-turbo");
  const today = new Date();
  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState<Date | null>(() => new Date());
  const [time, setTime] = useState<string | null>(null);
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

  const service = services.find((s) => s.id === serviceId) || services[0];
  const serviceCategory = getServiceCategory(serviceId);
  const isNatural = serviceCategory === "natural";
  const isCabine = serviceCategory === "cabine";
  const isClareamento = serviceCategory === "clareamento";
  const isTimedService = true;
  const selectedAddOns = additionalServices.filter((addOn) => selectedAddOnIds.includes(addOn.id));
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
      const isoDate=dateStr.split('/').reverse().join('-');
      const horariosOcupados = await unavailable(isoDate,serviceId);
      setBookedTimes(horariosOcupados);
      if (time && horariosOcupados.includes(normalizeTime(time))) setTime(null);
      return horariosOcupados;
  };

  useEffect(() => {
    if (!selected) return;
    let cancelled=false;
    setAvailabilityReady(false);setBookingError('');
    unavailable(selectedDateFormatted.split('/').reverse().join('-'),serviceId).then(slots=>{if(!cancelled){setBookedTimes(slots);setAvailabilityReady(true);}}).catch(e=>{if(!cancelled)setBookingError('Não foi possível consultar a agenda. '+e.message);});
    return()=>{cancelled=true;};
  }, [selectedDateFormatted, serviceId, catalog]);
  useEffect(()=>{if(catalogServices.length&&!catalogServices.some(s=>s.id===serviceId)){setServiceId(catalogServices[0].id);setTime(null);}},[catalog]);

  const buildWhatsappHref = () => {
    const displayTime = time;
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
    const displayTime = time;
    if (!displayTime || !selected || !summary) {
      submitRef.current = false;
      return;
    }
    const horarioNormalizado = normalizeTime(displayTime);
    const whatsappHref=buildWhatsappHref();
    setSubmitting(true);setBookingError('');
    try {
      const horariosAtualizados = await fetchAgendamentos(summary.date);
      if (horariosAtualizados.includes(horarioNormalizado)) {
        setTime(null);
        submitRef.current = false;
        window.alert("Esse horário acabou de ser ocupado. Escolha outro horário.");
        return;
      }

      await createBooking({serviceId,name:nome.trim(),phone:telefone.trim(),date:summary.date.split('/').reverse().join('-'),time:horarioNormalizado,notes:observacoes.trim(),addons:selectedAddOnIds});
      setAgendamentoConfirmado(true);
      setConfirmedWhatsappHref(whatsappHref);
      // Open WhatsApp only after the database accepted the booking.
      if(!demoMode) window.open(whatsappHref,'_blank','noopener,noreferrer');
      await fetchAgendamentos(summary.date).catch(()=>{});
    } catch (error) {
      console.error("Erro ao processar agendamento:", error);
      submitRef.current = false;
      setBookingError((error as Error).message || 'Não foi possível confirmar o agendamento. Tente novamente.');
      return;
    } finally {
      setSubmitting(false);
      submitRef.current=false;
    }

    setTimeout(() => {
      submitRef.current = false;
    }, 3000);
  };

  const stepActive = serviceId ? (selected ? (time ? 3 : 2) : 1) : 1;
  const selectedTimeDisplay: string = time || "—";

  return (
    <section id="agendar" className="scroll-mt-20 bg-secondary/40 sm:scroll-mt-32">
      <div className="container mx-auto px-4 py-14 sm:py-20">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-wine md:text-4xl">Agende seu horário</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm sm:text-base text-muted-foreground">
            Escolha o serviço ideal e agende sua sessão de forma rápida e prática.
          </p>
        </div>

        <p ref={progressRef} tabIndex={-1} aria-live="polite" className="mb-3 scroll-mt-24 text-center text-sm font-semibold text-wine outline-none sm:scroll-mt-36 lg:hidden">
          Etapa {mobileStep} de 3 — {["Escolha o serviço", "Data e horário", "Confirmação"][mobileStep - 1]}
        </p>
        <div className="mx-auto mb-8 grid max-w-4xl grid-cols-3 gap-2 sm:gap-4">
          {["Escolha o serviço", "Data e horário", "Confirme"].map((label, i) => {
            const n = i + 1;
            const active = stepActive >= n;
            return (
              <div key={label} className="flex items-center gap-2">
                <div aria-current={mobileStep === n ? "step" : undefined} className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold lg:hidden ${mobileStep >= n ? "bg-wine text-wine-foreground" : "bg-muted text-muted-foreground"}`}>
                  {n}
                </div>
                <div className={`hidden size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors lg:flex ${active ? "bg-wine text-wine-foreground" : "bg-muted text-muted-foreground"}`}>
                  {n}
                </div>
                <span className={`hidden text-sm font-medium lg:block ${active ? "text-foreground" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className={`${mobileStep === 3 ? "hidden" : "grid"} gap-6 lg:grid lg:grid-cols-2`}>
          {/* SELEÇÃO DE SERVIÇOS */}
          <div id="servicos" className={`${mobileStep === 1 ? "block" : "hidden"} scroll-mt-24 rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft sm:scroll-mt-36 lg:block`}>
            <h3 className="mb-4 text-lg sm:text-xl font-semibold text-wine">1. Escolha o serviço</h3>

            {/* Bronze Natural */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Wind className="size-5 text-wine" />
                <h4 className="text-sm font-semibold text-wine uppercase tracking-wide">Bronze Natural</h4>
              </div>
              <div className="space-y-3">
                {naturalServices.map((s) => (
                  <ServiceCard key={s.id} service={s} isSelected={serviceId === s.id} onSelect={() => { setServiceId(s.id); setTime(null);  }} />
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
                {cabineServices.map((s) => (
                  <ServiceCard key={s.id} service={s} isSelected={serviceId === s.id} onSelect={() => { setServiceId(s.id); setTime(null);  }} />
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
                {clareamentoServices.map((s) => (
                  <ServiceCard key={s.id} service={s} isSelected={serviceId === s.id} onSelect={() => { setServiceId(s.id); setTime(null);  }} />
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
                {additionalServices.map((addOn) => (
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
          <div className={`${mobileStep === 2 ? "block" : "hidden"} rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft lg:block`}>
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
                      onClick={() => { setSelected(c.date); setTime(null);  }}
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
                        <span><span className="font-semibold">Horário de chegada:</span> Escolha seu horário individual para o bronze natural. As clientes podem permanecer em atendimento ao mesmo tempo.</span>
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
                    {/* Seleção de Horários (Bronze em Cabine e Banho de Lua) */}
                    {isTimedService && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-foreground mb-2">Manhã</div>
                          <div className="grid grid-cols-4 gap-2">
                            {(isNatural ? naturalTimes : TIMES_MANHA).map((t) => {
                              const horarioNormalizado = normalizeTime(t);
                              const unavail = !availabilityReady || bookedTimes.includes(horarioNormalizado);
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
                        <div className={isNatural ? "hidden" : ""}>
                          <div className="text-xs font-semibold text-foreground mb-2">Tarde</div>
                          <div className="grid grid-cols-4 gap-2">
                            {(isNatural ? [] : TIMES_TARDE).map((t) => {
                              const horarioNormalizado = normalizeTime(t);
                              const unavail = !availabilityReady || bookedTimes.includes(horarioNormalizado);
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

        <div className={`${mobileStep === 3 ? "grid" : "hidden"} gap-6 lg:mt-6 lg:grid lg:grid-cols-2`}>
          {/* Como funciona */}
          <div className="hidden rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-soft lg:block">
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
              <Row icon={<Clock className="size-4" />} label="Horário" value={selectedTimeDisplay} />
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
            <div className={`mt-3 space-y-2 transition-all ${time ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <label htmlFor="booking-name" className="block text-sm font-medium">Seu nome completo</label>
              <Input
                id="booking-name"
                autoComplete="name"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-background text-base md:text-sm"
              />
              <label htmlFor="booking-phone" className="block text-sm font-medium">Telefone com DDD</label>
              <Input id="booking-phone" type="tel" placeholder="(88) 99999-9999" value={telefone} onChange={e=>setTelefone(e.target.value)} className="bg-background text-base md:text-sm" />
              <label htmlFor="booking-notes" className="block text-sm font-medium">Observações (opcional)</label>
              <Input
                id="booking-notes"
                placeholder="Observações (Opcional)"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="bg-background text-base md:text-sm"
              />
            </div>

            {/* Botão WhatsApp */}
            {(() => {
              const href = buildWhatsappHref();
              const canBook = !!((time && nome.trim().length>=2 && telefone.replace(/\D/g,'').length>=10 && href && availabilityReady && catalogServices.length && !submitting));


              return canBook ? (
                <button
                  type="button"
                  onClick={handleBookingClick}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-wine px-6 py-3 text-sm font-semibold text-wine-foreground shadow-elegant transition-all hover:bg-wine/90"
                >
                  <WhatsappIcon className="size-5" /> CONFIRMAR AGENDAMENTO
                </button>
              ) : (
                <span className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-wine/50 px-6 py-3 text-sm font-semibold text-wine-foreground shadow-elegant opacity-60">
                  <WhatsappIcon className="size-5" /> {submitting?'SALVANDO…':'CONFIRMAR AGENDAMENTO'}
                </span>
              );
            })()}
            {bookingError&&<p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{bookingError}</p>}
            {demoMode&&<p className="mt-2 text-xs text-amber-700">Demonstração local: reservas salvas somente neste navegador.</p>}
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
                    <p className="text-xs text-green-800 dark:text-green-200 mt-1">Sua solicitação foi salva na agenda. Se o WhatsApp não abriu, <a className="underline" href={confirmedWhatsappHref} target="_blank" rel="noreferrer">clique aqui para conversar com o estúdio</a>.</p>

                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 flex gap-3 lg:hidden">
          {mobileStep > 1 && (
            <button type="button" onClick={() => goToStep(mobileStep === 3 ? 2 : 1)} className="min-h-12 flex-1 rounded-full border border-wine px-4 py-3 text-sm font-semibold text-wine">
              Voltar
            </button>
          )}
          {mobileStep < 3 && (
            <button
              type="button"
              disabled={mobileStep === 2 && (!selected || selected.getDay() === 1 || !time)}
              onClick={() => goToStep(mobileStep === 1 ? 2 : 3)}
              className="min-h-12 flex-1 rounded-full bg-wine px-4 py-3 text-sm font-semibold text-wine-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mobileStep === 1 ? "Continuar para data e horário" : "Continuar para confirmação"}
            </button>
          )}
        </div>
        {mobileStep === 2 && !time && (
          <p className="mt-2 text-center text-sm text-muted-foreground lg:hidden">Escolha a data e o horário para continuar.</p>
        )}
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
