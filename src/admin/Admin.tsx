import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wallet,
  Sun,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Clock,
  LogOut,
  ExternalLink,
  Download,
  Ban,
  CalendarCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  labels,
  money,
  todayISO,
  dateLabel,
  monthlySummary,
  paid,
  active,
  times,
  naturalTimes,
  periods,
} from './domain';
import type { Appointment, Service, Addon, Status, BookingHours } from './domain';
import { defaultBookingHours, hoursForService } from './domain';
import {
  demoMode,
  supabase,
  loadAdmin,
  isAdmin,
  login,
  logout,
  createBooking,
  updateBooking,
  recordPayment,
  saveService,
  saveAddon,
  addBlock,
  removeBlock,
  saveBookingHours,
} from './store';
import type { Data } from './store';
import './admin.css';
import { Availability } from './Availability';

type Section = 'overview' | 'agenda' | 'clients' | 'finance' | 'services' | 'settings';
const navigation = [
  { id: 'overview', label: 'Visão geral', Icon: LayoutDashboard },
  { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
  { id: 'clients', label: 'Clientes', Icon: Users },
  { id: 'finance', label: 'Financeiro', Icon: Wallet },
  { id: 'services', label: 'Serviços', Icon: Sun },
  { id: 'settings', label: 'Configurações', Icon: Settings },
] as const;
const monthName = (m: string) =>
  new Date(m + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const blockLabel = (time: string) => {
  if (time === 'dia') return 'Dia inteiro';
  if (naturalTimes.includes(time)) return `${time} • bronze natural`;
  if (time === periods[0]) return 'Manhã (08h às 12h) • cabine e clareamento';
  if (time === periods[1]) return 'Tarde (15h às 20h) • cabine e clareamento';
  return `${time} • 1 hora`;
};
const initial = (s: string) =>
  s
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join('')
    .toUpperCase();
const iconSize = 18;

function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>('input,button')?.focus();
    return () => {
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, []);
  return (
    <div
      className="adm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') close();
        if (e.key === 'Tab') {
          const els = Array.from(
            ref.current?.querySelectorAll<HTMLElement>(
              'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]'
            ) || []
          );
          const first = els[0],
            last = els.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div ref={ref} className="adm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button className="adm-icon" onClick={close} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Badge({ status }: { status: Status }) {
  return (
    <span className={'adm-badge ' + status}>
      <i />
      {labels[status]}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="adm-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Admin() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [section, setSection] = useState<Section>('overview');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [day, setDay] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [clientPage, setClientPage] = useState(1);
  useEffect(() => setClientPage(1), [search]);
  const [status, setStatus] = useState('todos');
  const [onlyDay, setOnlyDay] = useState(true);
  const [detail, setDetail] = useState<Appointment | null>(null);
  const [detailReady, setDetailReady] = useState(false);
  const [balanceOnly, setBalanceOnly] = useState(false);
  const [availabilityService, setAvailabilityService] = useState('solazul');
  const [availabilityTime, setAvailabilityTime] = useState('');
  const [availabilityReady,setAvailabilityReady]=useState(false);
  const [availabilityRevision,setAvailabilityRevision]=useState(0);
  const [newBooking, setNewBooking] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [editAddon, setEditAddon] = useState<Addon | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState<null | { appointment: Appointment; status: Status }>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(todayISO());
  const [payMethod, setPayMethod] = useState('Pix');
  const [blockDate, setBlockDate] = useState(todayISO());
  const [blockType, setBlockType] = useState('dia');
  const [blockClock, setBlockClock] = useState('08:00');
  const [blockSlot, setBlockSlot] = useState(naturalTimes[0]);
  const [blockReason, setBlockReason] = useState('');

  const refresh = async () => {
    try {
      setData(await loadAdmin());
      setAvailabilityRevision(v=>v+1);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    document.title = 'Admin • LA MELANINA';
    isAdmin()
      .then(setAuthorized)
      .catch((e) => {
        setError(e.message);
        setAuthorized(false);
      });
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthorized(false);
        setData(null);
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authorized) return;
    refresh();
    const listener = () => refresh();
    window.addEventListener('storage', listener);
    window.addEventListener('melanina-change', listener);
    const interval = setInterval(listener, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', listener);
      window.removeEventListener('melanina-change', listener);
    };
  }, [authorized]);

  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(''), 5000);
      return () => clearTimeout(t);
    }
  }, [notice]);

  async function run(action: () => Promise<unknown>, message: string, close?: () => void) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
      await refresh();
      setNotice(message);
      close?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function openDetail(a: Appointment) {
    setDetail(structuredClone(a));
    setPayAmount(String(Math.max(0, a.amount - paid(a))));
    setPayDate(todayISO());
  }

  const rows = data?.appointments || [];
  const summary = monthlySummary(rows, month);
  const monthRows = rows.filter((a) => a.date.startsWith(month));
  const dayRows = rows
    .filter((a) => a.date === day && active(a.status))
    .sort((a, b) => a.time.localeCompare(b.time));
  const filtered = monthRows
    .filter(
      (a) =>
        (!onlyDay || a.date === day) &&
        (!balanceOnly || (active(a.status) && paid(a)<a.amount)) &&
        (status === 'todos' || a.status === status) &&
        `${a.name} ${a.phone} ${a.serviceName}`.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const clients = Object.values(
    rows.reduce<
      Record<string, { name: string; phone: string; visits: number; total: number; last: string; appointments: Appointment[] }>
    >((acc, a) => {
      const key = a.phone || a.name.toLowerCase().trim();
      const c = (acc[key] ||= {
        name: a.name,
        phone: a.phone,
        visits: 0,
        total: 0,
        last: a.date,
        appointments: [],
      });
      if (a.status === 'concluido') c.visits++;
      c.total += paid(a);
      c.last = c.last > a.date ? c.last : a.date;
      c.appointments.push(a);
      return acc;
    }, {})
  ).filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));

  const clientPageCount = Math.max(1, Math.ceil(clients.length / 12));
  const currentClientPage = Math.min(clientPage, clientPageCount);
  const visibleClients = clients.slice((currentClientPage - 1) * 12, currentClientPage * 12);

  function exportCSV() {
    const headers =
      section === 'finance'
        ? ['Cliente', 'Serviço', 'Data do pagamento', 'Forma', 'Valor']
        : ['Cliente', 'Telefone', 'Serviço', 'Data', 'Horário', 'Situação', 'Valor', 'Recebido'];
    const content =
      section === 'finance'
        ? rows.flatMap((a) =>
            a.payments
              .filter((p) => p.date.startsWith(month))
              .map((p) => [a.name, a.serviceName, p.date, p.method, p.amount.toFixed(2)])
          )
        : filtered.map((a) => [
            a.name,
            a.phone,
            a.serviceName,
            a.date,
            a.time,
            labels[a.status],
            a.amount.toFixed(2),
            paid(a).toFixed(2),
          ]);
    const escape = (v: unknown) => '"' + String(v).replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"';
    const blob = new Blob(['\ufeff' + [headers, ...content].map((r) => r.map(escape).join(';')).join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `la-melanina-${section}-${month}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function shiftMonth(delta: number) {
    const d = new Date(month + '-01T12:00:00');
    d.setMonth(d.getMonth() + delta);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setMonth(m);
    setDay(m + '-01');
  }

  function switchSection(id: Section) {
    setSection(id);
    setMobileMenu(false);
    setSearch('');
    setOnlyDay(id === 'agenda');
    setBalanceOnly(false);
    if (id === 'agenda') { setDay(todayISO()); setMonth(todayISO().slice(0,7)); }
    setStatus('todos');
  }

  function shiftDay(delta:number) {
    const date=new Date(day+'T12:00:00'); date.setDate(date.getDate()+delta);
    const next=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    setDay(next);setMonth(next.slice(0,7));setOnlyDay(true);
  }

  function quickActions(a:Appointment) {
    return <div className="adm-row-actions">
      {a.status==='pendente' && <button disabled={busy} className="adm-button" onClick={()=>run(()=>updateBooking({...a,status:'confirmado'}),'Agendamento confirmado.')}>Confirmar</button>}
      {active(a.status)&&paid(a)<a.amount&&<button className="adm-button" onClick={()=>{openDetail(a);setTimeout(()=>document.getElementById('admin-payment')?.scrollIntoView({behavior:'smooth'}),100);}}>Receber</button>}
      <button className="adm-button" onClick={()=>openDetail(a)}>Remarcar / editar</button>
      {a.phone && <a className="adm-button" href={`https://wa.me/${a.phone.startsWith('55')?a.phone:'55'+a.phone}`} target="_blank" rel="noreferrer">WhatsApp <ExternalLink size={13}/></a>}
      {['pendente','confirmado'].includes(a.status)&&<button disabled={busy} className="adm-button" onClick={()=>setConfirm({appointment:a,status:'concluido'})}>Concluir</button>}
      {active(a.status)&&<button disabled={busy} className="adm-text-button" onClick={()=>setConfirm({appointment:a,status:'cancelado'})}>Cancelar</button>}
    </div>;
  }

  function appointmentTable(list: Appointment[]) {
    if (!list.length) {
      return (
        <div className="adm-empty">
          <CalendarDays size={30} />
          <h3>Nenhum agendamento por aqui</h3>
          <p>Escolha outra data ou crie um novo atendimento.</p>
          <button className="adm-button primary" onClick={() => setNewBooking(true)}>
            <Plus size={16} /> Novo agendamento
          </button>
        </div>
      );
    }

    return (
      <>
        {/* Visualização em tabela (Desktop) */}
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Serviço</th>
                <th>Data e horário</th>
                <th>Situação</th>
                <th>Valor</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}>
                  <td>
                    <button className="adm-client-button" onClick={() => openDetail(a)}>
                      <span className="adm-avatar">{initial(a.name)}</span>
                      <span>
                        <strong>{a.name}</strong>
                        <small>{a.phone || 'Sem telefone informado'}</small>
                      </span>
                    </button>
                  </td>
                  <td>
                    {a.serviceName}
                    <small>
                      {a.category === 'natural'
                        ? 'Bronze natural'
                        : a.category === 'cabine'
                        ? 'Bronze em cabine'
                        : 'Clareamento'}
                    </small>
                  </td>
                  <td>
                    <strong>{dateLabel(a.date)}</strong>
                    <small>{a.time}</small>
                  </td>
                  <td>
                    <Badge status={a.status} />
                  </td>
                  <td>
                    <strong>{money(a.amount)}</strong>
                    <small>
                      {paid(a) >= a.amount ? 'Pago integralmente' : `Pago ${money(paid(a))} · Falta ${money(Math.max(0,a.amount-paid(a)))}`}
                    </small>
                  </td>
                  <td>
                    {a.serviceId==='duplo' && Number(a.time.slice(0,2))>=12 && active(a.status) && <span className="adm-rule-warning">Remarcar: Duplo somente de manhã</span>}
                    {quickActions(a)}
                    <button
                      className="adm-icon"
                      onClick={() => openDetail(a)}
                      aria-label={`Abrir ${a.name}`}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Visualização em cards (Mobile) */}
        <div className="adm-cards-wrap">
          {list.map((a) => (
            <article className="adm-app-card" key={a.id}>
              <div className="adm-app-card-head">
                <div className="adm-app-card-client">
                  <span className="adm-avatar">{initial(a.name)}</span>
                  <div>
                    <strong>{a.name}</strong>
                    <small>{a.phone || 'Sem telefone informado'}</small>
                  </div>
                </div>
                <Badge status={a.status} />
              </div>
              <div className="adm-app-card-body">
                <div className="adm-app-card-info">
                  <span>Serviço</span>
                  <strong>{a.serviceName}</strong>
                  <small>
                    {a.category === 'natural'
                      ? 'Bronze natural'
                      : a.category === 'cabine'
                      ? 'Bronze em cabine'
                      : 'Clareamento'}
                  </small>
                </div>
                <div className="adm-app-card-info">
                  <span>Data e horário</span>
                  <strong>{dateLabel(a.date)}</strong>
                  <small>{a.time}</small>
                </div>
              </div>
              <div className="adm-app-card-foot">
                <div className="adm-app-card-amount">
                  <span>Valor: <strong>{money(a.amount)}</strong></span>
                  <span
                    className={`adm-pay-tag ${
                      paid(a) >= a.amount ? 'pago' : paid(a) > 0 ? 'sinal' : 'pendente'
                    }`}
                  >
                    {paid(a) >= a.amount ? 'Pago integralmente' : `Pago ${money(paid(a))} · Falta ${money(Math.max(0,a.amount-paid(a)))}`}
                  </span>
                </div>
                <button
                  className="adm-button"
                  onClick={() => openDetail(a)}
                  aria-label={`Ver detalhes de ${a.name}`}
                >
                  Detalhes <ArrowUpRight size={15} />
                </button>
              </div>
              {a.serviceId==='duplo' && Number(a.time.slice(0,2))>=12 && active(a.status) && <p className="adm-rule-warning">Remarcar: Bronze Duplo somente pela manhã.</p>}
              {quickActions(a)}
            </article>
          ))}
        </div>
      </>
    );
  }

  if (authorized === null) return <div className="adm-login">Carregando painel…</div>;
  if (!authorized)
    return (
      <div className="adm-login">
        <div className="adm-login-card">
          <div className="adm-logo">
            LA MELANINA<span>ESTÚDIO DE BRONZE</span>
          </div>
          <div className="adm-login-icon">
            <Sun size={30} />
          </div>
          <h1>Seu estúdio, em um só lugar.</h1>
          <p>Entre para cuidar da agenda e acompanhar cada resultado.</p>
          {error && (
            <div className="adm-alert" role="alert">
              {error}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await login(email, password);
                setAuthorized(true);
              }, 'Bem-vinda ao painel.');
            }}
          >
            <Field label="E-mail">
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </Field>
            <Field label="Senha">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
              />
            </Field>
            <button disabled={busy || !supabase} className="adm-button primary full">
              {busy ? 'Entrando…' : 'Entrar no painel'}
              <ArrowUpRight size={18} />
            </button>
          </form>
          {demoMode && (
            <div className="adm-demo-login">
              <p>Demonstração local • dados fictícios</p>
              <button
                className="adm-button"
                onClick={() => {
                  sessionStorage.setItem('melanina-demo-access', 'yes');
                  setAuthorized(true);
                }}
              >
                Explorar demonstração <ArrowUpRight size={18} />
              </button>
            </div>
          )}
          {!supabase && !demoMode && <p>Configure a conexão com Supabase para acessar.</p>}
          <a href="/">Voltar ao site</a>
        </div>
      </div>
    );

  return (
    <div className="adm-shell">
      {/* Sidebar Desktop */}
      <aside className="adm-sidebar">
        <a href="/admin" className="adm-logo">
          LA MELANINA<span>ESTÚDIO DE BRONZE</span>
        </a>
        <div className="adm-workspace">
          <span className="adm-workspace-icon">
            <Sun size={19} />
          </span>
          <span>
            <strong>Meu estúdio</strong>
            <small>Painel administrativo</small>
          </span>
          <span className="adm-online" />
        </div>
        <p className="adm-nav-label">GESTÃO DO ESTÚDIO</p>
        <nav>
          {navigation.map(({ id, label, Icon }) => (
            <button
              className={section === id ? 'selected' : ''}
              key={id}
              onClick={() => switchSection(id)}
            >
              <Icon size={iconSize} />
              {label}
              {id === 'agenda' && (
                <span className="adm-count">
                  {rows.filter((a) => a.status === 'pendente').length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="adm-sidebar-bottom">
          <div className="adm-tip">
            <Sparkles size={20} />
            <strong>Mais tempo para fazer brilhar.</strong>
            <p>Uma agenda organizada deixa espaço para cuidar de cada cliente.</p>
          </div>
          <a href="/" target="_blank" rel="noreferrer">
            <ExternalLink size={17} /> Ver meu site
          </a>
          <button
            onClick={() =>
              run(async () => {
                await logout();
                setAuthorized(false);
                setData(null);
              }, 'Sessão encerrada.')
            }
          >
            <LogOut size={17} /> Sair do painel
          </button>
          <div className="adm-owner">
            <span className="adm-avatar">LM</span>
            <span>
              <strong>La Melanina</strong>
              <small>Administradora</small>
            </span>
          </div>
        </div>
      </aside>

      {/* Navegação Inferior Mobile */}
      <nav className="adm-mobile-nav" aria-label="Navegação principal">
        {(
          [
            { id: 'overview', label: 'Início', Icon: LayoutDashboard },
            { id: 'agenda', label: 'Agenda', Icon: CalendarDays },
            { id: 'clients', label: 'Clientes', Icon: Users },
          ] as const
        ).map(({ id, label, Icon }) => (
          <button
            className={section === id ? 'selected' : ''}
            key={id}
            onClick={() => switchSection(id)}
            aria-current={section === id ? 'page' : undefined}
          >
            <Icon size={19} />
            <span>{label}</span>
          </button>
        ))}
        <button
          className={
            mobileMenu || ['finance', 'services', 'settings'].includes(section)
              ? 'selected'
              : ''
          }
          onClick={() => setMobileMenu((open) => !open)}
          aria-expanded={mobileMenu}
          aria-controls="adm-mobile-more"
        >
          <Plus size={19} />
          <span>Mais</span>
        </button>
        {mobileMenu && (
          <div className="adm-mobile-more" id="adm-mobile-more">
            {navigation
              .filter(({ id }) => id === 'finance' || id === 'services' || id === 'settings')
              .map(({ id, label, Icon }) => (
                <button
                  className={section === id ? 'selected' : ''}
                  key={id}
                  onClick={() => switchSection(id)}
                  aria-current={section === id ? 'page' : undefined}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            <button
              onClick={() =>
                run(async () => {
                  await logout();
                  setAuthorized(false);
                  setData(null);
                }, 'Sessão encerrada.')
              }
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        )}
      </nav>

      <div className="adm-content">
        <header className="adm-topbar">
          <div>
            <span>Meu estúdio</span>
            <ChevronRight size={14} />
            <strong>{navigation.find((n) => n.id === section)?.label}</strong>
          </div>
          <div className="adm-topbar-right">
            <span className="adm-live">
              <i />
              {demoMode ? 'Prévia local' : 'Conectado ao Supabase'}
            </span>
            <span className="adm-avatar small">LM</span>
          </div>
        </header>

        <main className="adm-main">
          {demoMode && (
            <div className="adm-demo-banner">
              <Sparkles size={15} />
              <span>
                <strong>Modo demonstração.</strong> Dados fictícios, salvos só neste navegador. Conexão com Supabase pendente.
              </span>
            </div>
          )}

          <div className="adm-page-heading">
            <div>
              <p className="adm-eyebrow">
                LA MELANINA / {section === 'overview' ? 'SEU DIA COM MAIS CONTROLE' : 'GESTÃO'}
              </p>
              <h1>
                {section === 'overview'
                  ? 'Bem-vinda ao seu estúdio.'
                  : navigation.find((n) => n.id === section)?.label}
              </h1>
              <p>
                {
                  ({
                    overview: 'Acompanhe sua agenda, seus atendimentos e o brilho dos seus resultados.',
                    agenda: 'Cada horário organizado. Cada cliente bem cuidada.',
                    clients: 'Conheça quem confia no seu trabalho.',
                    finance: 'Veja o que entrou, o que falta receber e o que você realizou.',
                    services: 'Seu catálogo e seus preços, sempre atualizados.',
                    settings: 'Organize suas pausas e a disponibilidade do estúdio.',
                  })[section]
                }
              </p>
            </div>
            <button className="adm-button primary" onClick={() => setNewBooking(true)}>
              <Plus size={18} /> Novo agendamento
            </button>
          </div>

          {error && (
            <div className="adm-alert" role="alert">
              {error}
              <button onClick={() => setError('')} aria-label="Dispensar erro">
                <X size={16} />
              </button>
            </div>
          )}

          {notice && (
            <div className="adm-toast" role="status">
              <Check size={18} />
              {notice}
            </div>
          )}

          {!data ? (
            <div className="adm-empty">
              <p>{error ? 'Não foi possível carregar a agenda.' : 'Carregando seus dados…'}</p>
              <button className="adm-button" onClick={refresh}>
                <RefreshCw size={16} /> Tentar carregar
              </button>
            </div>
          ) : (
            <>
              {['overview', 'agenda', 'finance'].includes(section) && (
                <div className="adm-period-row">
                  <span>
                    <span className="adm-online" />{' '}
                    {section === 'overview'
                      ? 'Seu estúdio em números'
                      : section === 'finance'
                      ? 'Resumo do período'
                      : 'Agendamentos do período'}
                  </span>
                  <div className="adm-period">
                    <button onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
                      <ChevronLeft size={17} />
                    </button>
                    <CalendarDays size={16} />
                    <label>
                      <span className="adm-sr-only">Mês do relatório</span>
                      <input
                        type="month"
                        value={month}
                        onInput={(e) => {
                          if (e.currentTarget.value) setMonth(e.currentTarget.value);
                        }}
                      />
                    </label>
                    <button onClick={() => shiftMonth(1)} aria-label="Próximo mês">
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              )}

              {['overview', 'finance'].includes(section) && (
                <div className="adm-stats">
                  {[
                    {
                      label: 'Recebido no mês',
                      value: money(summary.received),
                      Icon: Wallet,
                      tag: 'Pagamentos registrados',
                      color: 'green',
                    },
                    {
                      label: 'A receber no mês',
                      value: money(summary.expected),
                      Icon: ArrowDownLeft,
                      tag: 'Saldo dos agendamentos',
                      color: 'gold',
                    },
                    {
                      label: 'Atendimentos concluídos',
                      value: String(summary.completed).padStart(2, '0'),
                      Icon: CalendarCheck,
                      tag: `${money(summary.revenue)} em serviços`,
                      color: 'rose',
                    },
                    {
                      label: 'Agendamentos no mês',
                      value: String(summary.bookings).padStart(2, '0'),
                      Icon: CalendarDays,
                      tag: monthName(month),
                      color: 'purple',
                    },
                  ].map((x) => (
                    <div className="adm-stat" key={x.label}>
                      <div>
                        <span>{x.label}</span>
                        <span className={'adm-stat-icon ' + x.color}>
                          <x.Icon size={19} />
                        </span>
                      </div>
                      <strong>{x.value}</strong>
                      <small>{x.tag}</small>
                    </div>
                  ))}
                </div>
              )}

              {section === 'overview' && (
                <div className="adm-overview-flow">
                  <div className="adm-overview-grid">
                    <section className="adm-card adm-chart">
                      <div className="adm-card-heading">
                        <div>
                          <h2>Seu crescimento, dia a dia</h2>
                          <p>Recebimentos de {monthName(month)}</p>
                        </div>
                        <span className="adm-chart-legend">
                          <i />
                          Valor recebido
                        </span>
                      </div>
                      <RevenueChart rows={rows} month={month} />
                      <div className="adm-chart-footer">
                        <span>Todo atendimento conta. Todo resultado também.</span>
                        <button onClick={() => switchSection('finance')}>
                          Ver financeiro <ArrowUpRight size={15} />
                        </button>
                      </div>
                    </section>
                    <section className="adm-card adm-calendar-card">
                      <div className="adm-card-heading">
                        <h2>Sua agenda</h2>
                        <CalendarDays size={18} />
                      </div>
                      <MiniCalendar
                        month={month}
                        day={day}
                        rows={rows}
                        onDay={(d) => {
                          setDay(d);
                        }}
                        onShift={shiftMonth}
                      />
                      <div className="adm-calendar-legend">
                        <span>
                          <i /> Com atendimento
                        </span>
                        <span>Segundas: fechado</span>
                      </div>
                    </section>
                  </div>

                  <section className="adm-card adm-day-card">
                    <div className="adm-card-heading">
                      <div>
                        <h2>
                          {day === todayISO() ? 'Agenda de hoje' : 'Agenda de ' + dateLabel(day)}{' '}
                          <span className="adm-inline-count">{dayRows.length}</span>
                        </h2>
                        <p>
                          {new Date(day + 'T12:00:00').toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </p>
                      </div>
                      <button
                        className="adm-text-button"
                        onClick={() => {
                          setSection('agenda');
                          setOnlyDay(true);
                          setMonth(day.slice(0, 7));
                        }}
                      >
                        Ver agenda completa <ArrowUpRight size={16} />
                      </button>
                    </div>
                    {appointmentTable(dayRows)}
                  </section>
                </div>
              )}

              {section === 'agenda' && (
                <div className="adm-agenda-workspace">
                  <div className="adm-agenda-toolbar">
                    <div><h2>{onlyDay ? (day===todayISO()?'Agenda de hoje':dateLabel(day)) : 'Agenda do mês'}</h2><p>Atendimentos, recebimentos e vagas em um só lugar.</p></div>
                    <div className="adm-day-navigation"><button className="adm-button" aria-label="Dia anterior" onClick={()=>shiftDay(-1)}><ChevronLeft size={18}/></button><button className="adm-button" onClick={()=>{setDay(todayISO());setMonth(todayISO().slice(0,7));setOnlyDay(true);}}>Hoje</button><button className="adm-button" onClick={()=>{const d=new Date(todayISO()+'T12:00:00');d.setDate(d.getDate()+1);const next=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;setDay(next);setMonth(next.slice(0,7));setOnlyDay(true);}}>Amanhã</button><button className="adm-button" aria-label="Próximo dia" onClick={()=>shiftDay(1)}><ChevronRight size={18}/></button></div>
                  </div>
                  <div className="adm-agenda-summary">
                    <div><span>Atendimentos no dia</span><strong>{dayRows.length}</strong></div>
                    <div><span>Recebido no dia selecionado</span><strong>{money(rows.reduce((total,a)=>total+a.payments.filter(p=>p.date===day).reduce((v,p)=>v+p.amount,0),0))}</strong></div>
                    <div><span>Saldo dos atendimentos do dia</span><strong>{money(dayRows.reduce((v,a)=>v+Math.max(0,a.amount-paid(a)),0))}</strong></div>
                  </div>
                  <section className="adm-card">
                  <div className="adm-filters">
                    <label className="adm-search">
                      <Search size={17} />
                      <input
                        aria-label="Buscar agendamentos"
                        placeholder="Buscar cliente ou serviço…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <select
                      aria-label="Filtrar situação"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="todos">Todas as situações</option>
                      {Object.entries(labels).map(([k, v]) => (
                        <option value={k} key={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                    <label className="adm-check">
                      <input
                        type="checkbox"
                        checked={onlyDay}
                        onChange={(e) => setOnlyDay(e.target.checked)}
                      />
                      Por dia
                    </label>
                    {onlyDay && (
                      <input
                        aria-label="Dia da agenda"
                        type="date"
                        value={day}
                        onInput={(e) => {
                          setDay(e.currentTarget.value);
                          setMonth(e.currentTarget.value.slice(0, 7));
                        }}
                      />
                    )}
                    <button className="adm-button" onClick={exportCSV}>
                      <Download size={16} /> Exportar
                    </button>
                  </div>
                  <div className="adm-agenda-options"><label className="adm-check"><input type="checkbox" checked={balanceOnly} onChange={e=>setBalanceOnly(e.target.checked)}/>Somente saldo pendente</label><button className="adm-text-button" disabled={busy} onClick={refresh}><RefreshCw size={15}/> Atualizar agenda</button></div>
                  {onlyDay ? <>{[['Manhã',filtered.filter(a=>a.category!=='natural'&&Number(a.time.slice(0,2))<12)],['Tarde e noite',filtered.filter(a=>a.category!=='natural'&&Number(a.time.slice(0,2))>=12)],['Bronze natural',filtered.filter(a=>a.category==='natural')]].map(([label,list])=><section className="adm-agenda-period" key={label as string}><h3>{label as string}<span>{(list as Appointment[]).length}</span></h3>{appointmentTable(list as Appointment[])}</section>)}</> : appointmentTable(filtered)}
                  <div className="adm-table-footer">
                    {filtered.length} agendamento(s) encontrado(s)
                  </div>
                </section>
                {data && <section className="adm-card adm-availability-panel"><h2>Consultar vagas livres</h2><p>Escolha o serviço e toque em uma vaga para criar um agendamento.</p><div className="adm-form-grid"><Field label="Serviço"><select value={availabilityService} onChange={e=>{setAvailabilityService(e.target.value);setAvailabilityTime('');}}>{data.services.filter(s=>s.active).map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></Field><Field label="Data"><input type="date" value={day} onChange={e=>{if(e.target.value){setDay(e.target.value);setMonth(e.target.value.slice(0,7));setAvailabilityTime('');}}}/></Field></div><Availability date={day} serviceId={availabilityService} value={availabilityTime} onChange={setAvailabilityTime} revision={availabilityRevision} onReady={setAvailabilityReady}/><button className="adm-button primary" disabled={!availabilityTime || !availabilityReady} onClick={()=>setNewBooking(true)}>Agendar nesta vaga</button>{data.blocks.filter(b=>b.date===day).map(b=><p className="adm-rule-warning" key={b.id}>Bloqueado: {blockLabel(b.time)} · {b.reason}</p>)}</section>}
                </div>
              )}

              {section === 'clients' && (
                <>
                  <div className="adm-filters standalone">
                    <label className="adm-search">
                      <Search size={17} />
                      <input
                        aria-label="Buscar clientes"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou telefone…"
                      />
                    </label>
                    <span>{clients.length} clientes cadastradas pela agenda</span>
                  </div>
                  <div className="adm-client-grid">
                    {visibleClients.map((c) => (
                      <section className="adm-card adm-client-card" key={c.phone || c.name.toLowerCase().trim()}>
                        <span className="adm-avatar large">{initial(c.name)}</span>
                        <h2>{c.name}</h2>
                        <p>{c.phone || 'Telefone não informado'}</p>
                        <div>
                          <span>
                            <strong>{c.visits}</strong>Atendimentos
                          </span>
                          <span>
                            <strong>{money(c.total)}</strong>Recebido
                          </span>
                        </div>
                        <small>Último agendamento: {dateLabel(c.last)}</small>
                        {c.phone && (
                          <a
                            className="adm-button"
                            href={`https://wa.me/${
                              c.phone.startsWith('55') ? c.phone : '55' + c.phone
                            }`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Abrir WhatsApp <ExternalLink size={15} />
                          </a>
                        )}
                        <button
                          className="adm-text-button"
                          onClick={() => {
                            setSection('agenda');
                            setSearch(c.name);
                            setMonth(c.last.slice(0, 7));
                          }}
                        >
                          Ver agendamentos <ArrowUpRight size={15} />
                        </button>
                      </section>
                    ))}
                  </div>
                  {clients.length > 0 && (
                    <nav className="adm-client-pagination" aria-label="Páginas de clientes">
                      <span aria-live="polite">{(currentClientPage - 1) * 12 + 1}–{Math.min(currentClientPage * 12, clients.length)} de {clients.length} clientes</span>
                      <div>
                        <button className="adm-button" disabled={currentClientPage === 1} onClick={() => setClientPage(currentClientPage - 1)}>Anterior</button>
                        <span>Página {currentClientPage} de {clientPageCount}</span>
                        <button className="adm-button" disabled={currentClientPage === clientPageCount} onClick={() => setClientPage(currentClientPage + 1)}>Próxima</button>
                      </div>
                    </nav>
                  )}
                  {!clients.length && <div className="adm-empty">Nenhuma cliente encontrada.</div>}
                </>
              )}

              {section === 'finance' && (
                <>
                  <div className="adm-overview-grid">
                    <section className="adm-card adm-chart">
                      <div className="adm-card-heading">
                        <h2>Entradas do mês</h2>
                        <Wallet size={19} />
                      </div>
                      <RevenueChart rows={rows} month={month} />
                    </section>
                    <section className="adm-card">
                      <div className="adm-card-heading">
                        <h2>Serviços concluídos</h2>
                        <Sun size={19} />
                      </div>
                      <div className="adm-service-ranking">
                        {data.services.map((s) => {
                          const n = monthRows.filter(
                            (a) => a.serviceId === s.id && a.status === 'concluido'
                          );
                          return n.length ? (
                            <div key={s.id}>
                              <span>
                                {s.name}
                                <small>{n.length} atendimento(s)</small>
                              </span>
                              <strong>{money(n.reduce((v, a) => v + a.amount, 0))}</strong>
                            </div>
                          ) : null;
                        })}
                        {!summary.completed && <p>Nenhum atendimento concluído neste mês.</p>}
                      </div>
                    </section>
                  </div>
                  <section className="adm-card">
                    <div className="adm-card-heading">
                      <div>
                        <h2>Histórico de recebimentos</h2>
                        <p>O mês é definido pela data em que o pagamento entrou.</p>
                      </div>
                      <button className="adm-button" onClick={exportCSV}>
                        <Download size={16} /> Exportar CSV
                      </button>
                    </div>
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            <th>Cliente</th>
                            <th>Serviço</th>
                            <th>Data</th>
                            <th>Forma</th>
                            <th>Recebido</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.flatMap((a) =>
                            a.payments
                              .filter((p) => p.date.startsWith(month))
                              .map((p) => (
                                <tr key={p.id}>
                                  <td>
                                    <button
                                      className="adm-text-button"
                                      onClick={() => openDetail(a)}
                                    >
                                      {a.name}
                                    </button>
                                  </td>
                                  <td>{a.serviceName}</td>
                                  <td>{dateLabel(p.date)}</td>
                                  <td>
                                    <span className="adm-badge confirmado">{p.method}</span>
                                  </td>
                                  <td>
                                    <strong>{money(p.amount)}</strong>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {summary.received === 0 && (
                      <div className="adm-empty">Sem recebimentos registrados neste mês.</div>
                    )}
                  </section>
                </>
              )}

              {section === 'services' && (
                <>
                  <div className="adm-client-grid">
                    {data.services.map((s) => (
                      <section className="adm-card adm-service-card" key={s.id}>
                        <div>
                          <span
                            className={
                              'adm-stat-icon ' + (s.category === 'natural' ? 'gold' : 'rose')
                            }
                          >
                            <Sun size={22} />
                          </span>
                          <span
                            className={
                              'adm-badge ' + (s.active ? 'confirmado' : 'cancelado')
                            }
                          >
                            {s.active ? 'Disponível' : 'Pausado'}
                          </span>
                        </div>
                        <small>
                          {s.category === 'natural'
                            ? 'BRONZE NATURAL'
                            : s.category === 'cabine'
                            ? 'BRONZE EM CABINE'
                            : 'CLAREAMENTO'}
                        </small>
                        <h2>{s.name}</h2>
                        <p>{s.desc}</p>
                        <strong>{money(s.price)}</strong>
                        <span className="adm-duration">
                          <Clock size={15} />
                          {s.category === 'natural'
                            ? 'Horário de chegada'
                            : s.duration + ' minutos'}
                        </span>
                        <button
                          className="adm-button"
                          onClick={() => setEditService({ ...s })}
                        >
                          Editar serviço <ArrowUpRight size={16} />
                        </button>
                      </section>
                    ))}
                  </div>
                  <section className="adm-card">
                    <div className="adm-card-heading">
                      <h2>Adicionais</h2>
                    </div>
                    <div className="adm-addons">
                      {data.addons.map((a) => (
                        <div key={a.id}>
                          <span>{a.name}</span>
                          <strong>{money(a.price)}</strong>
                          <button
                            className="adm-text-button"
                            onClick={() => setEditAddon({ ...a })}
                          >
                            Editar
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {section === 'settings' && data && (
                <BookingHoursEditor
                  hours={data.bookingHours}
                  busy={busy}
                  save={(hours) =>
                    run(() => saveBookingHours(hours), 'Horários públicos atualizados.')
                  }
                />
              )}

              {section === 'settings' && (
                <div className="adm-settings-grid">
                  <section className="adm-card">
                    <div className="adm-card-heading">
                      <div>
                        <h2>Bloquear disponibilidade</h2>
                        <p>Escolha o que ficará indisponível para novas reservas.</p>
                      </div>
                      <Ban size={19} />
                    </div>
                    <form
                      className="adm-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        run(
                          () =>
                            addBlock({
                              date: blockDate,
                              time:
                                blockType === 'horario'
                                  ? blockClock
                                  : blockType === 'vaga-natural'
                                    ? blockSlot
                                    : blockType,
                              reason: blockReason,
                            }),
                          'Bloqueio aplicado.',
                          () => setBlockReason('')
                        );
                      }}
                    >
                      <Field label="Data">
                        <input
                          type="date"
                          required
                          value={blockDate}
                          onInput={(e) => setBlockDate(e.currentTarget.value)}
                        />
                      </Field>
                      <Field label="O que deseja bloquear?">
                        <select
                          value={blockType}
                          onChange={(e) => setBlockType(e.target.value)}
                        >
                          <option value="dia">Dia inteiro — todos os serviços</option>
                          <optgroup label="Cabine e clareamento">
                            <option value={periods[0]}>Manhã — das 08h às 12h</option>
                            <option value={periods[1]}>Tarde — das 15h às 20h</option>
                            <option value="horario">Uma hora a partir de um horário</option>
                          </optgroup>
                          <optgroup label="Bronze natural">
                            <option value="vaga-natural">Uma vaga específica</option>
                          </optgroup>
                        </select>
                      </Field>
                      {blockType === 'horario' && (
                        <Field label="Horário de início">
                          <input
                            type="time"
                            required
                            step={300}
                            value={blockClock}
                            onInput={(e) => setBlockClock(e.currentTarget.value)}
                          />
                        </Field>
                      )}
                      {blockType === 'vaga-natural' && (
                        <Field label="Vaga do bronze natural">
                          <select
                            value={blockSlot}
                            onChange={(e) => setBlockSlot(e.target.value)}
                          >
                            {naturalTimes.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <p className="adm-help">
                        Um horário bloqueia uma hora a partir do início. O bronze natural usa
                        vagas numeradas; períodos da manhã e da tarde valem para cabine e
                        clareamento.
                      </p>
                      <Field label="Motivo">
                        <input
                          required
                          maxLength={200}
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder="Ex.: compromisso pessoal"
                        />
                      </Field>
                      <button disabled={busy} className="adm-button primary">
                        <Ban size={16} /> Aplicar bloqueio
                      </button>
                    </form>
                  </section>

                  <section className="adm-card">
                    <div className="adm-card-heading">
                      <h2>Horários bloqueados</h2>
                    </div>
                    <div className="adm-block-list">
                      {data.blocks.map((b) => (
                        <div key={b.id}>
                          <span>
                            <strong>
                              {dateLabel(b.date)} • {blockLabel(b.time)}
                            </strong>
                            <small>{b.reason}</small>
                          </span>
                          <button
                            disabled={busy}
                            className="adm-button"
                            onClick={() => run(() => removeBlock(b.id), 'Horário liberado.')}
                          >
                            Liberar
                          </button>
                        </div>
                      ))}
                      {!data.blocks.length && <p>Nenhum bloqueio cadastrado.</p>}
                    </div>
                  </section>

                  <section className="adm-card adm-connection">
                    <h2>Funcionamento do estúdio</h2>
                    <p>
                      Escolha os dias de funcionamento e os horários em Disponibilidade para as
                      clientes. É possível abrir também às segundas-feiras.
                    </p>
                    <p>
                      Bronze natural: 12 vagas por dia, sem horário escolhido. Sábado: 08h às 11h
                      e 14h às 16h; domingo: 08h às 12h. Cabine e clareamento compartilham a agenda
                      de horários.
                    </p>
                    <h2>Conexão e acesso</h2>
                    <p>
                      {demoMode
                        ? 'Demonstração ativa. O Supabase permitirá compartilhar dados entre celular e computador com acesso por e-mail e senha.'
                        : 'Conexão Supabase ativa. Somente contas autorizadas podem acessar dados administrativos.'}
                    </p>
                    <p>
                      Alterações de preço valem para novas reservas. Atendimentos antigos mantêm o
                      valor combinado.
                    </p>
                  </section>
                </div>
              )}
            </>
          )}

          <footer className="adm-footer">
            <span>
              LA MELANINA <i /> Gestão com cuidado.
            </span>
            <span>{demoMode ? 'Demonstração local' : 'Painel administrativo'}</span>
          </footer>
        </main>
      </div>

      {newBooking && data && (
        <NewBooking
          initialDate={section==='agenda'?day:todayISO()}
          initialService={availabilityTime?availabilityService:undefined}
          initialTime={availabilityTime}
          error={error}
          hours={data.bookingHours}
          services={data.services}
          addons={data.addons}
          busy={busy}
          close={() => setNewBooking(false)}
          save={(input) =>
            run(() => createBooking(input, true), 'Agendamento criado.', () =>
              setNewBooking(false)
            )
          }
        />
      )}

      {detail && (
        <Modal title="Detalhes do agendamento" close={() => setDetail(null)}>
          <div className="adm-detail-modal-content">
            {error && <p className="adm-slot-error" role="alert">{error}</p>}
            <div className="adm-detail-hero">
              <span className="adm-avatar large">{initial(detail.name)}</span>
              <div className="adm-detail-hero-info">
                <h3>{detail.name}</h3>
                <p>
                  {detail.serviceName} • {dateLabel(detail.date)} às {detail.time}
                </p>
                <Badge status={detail.status} />
              </div>
              <div className="adm-detail-hero-price">
                <small>Total</small>
                <strong>{money(detail.amount)}</strong>
              </div>
            </div>

            {/* Ações rápidas de destaque no topo */}
            <div className="adm-detail-quick-actions">
              {['pendente', 'confirmado'].includes(detail.status) && (
                <button
                  type="button"
                  disabled={busy}
                  className="adm-button success"
                  onClick={() => setConfirm({ appointment: detail, status: 'concluido' })}
                >
                  <Check size={16} /> Concluir atendimento
                </button>
              )}
              {active(detail.status) && (
                <button
                  type="button"
                  disabled={busy}
                  className="adm-button danger"
                  onClick={() => setConfirm({ appointment: detail, status: 'cancelado' })}
                >
                  <Ban size={16} /> Cancelar agendamento
                </button>
              )}
            </div>

            {/* Edição de dados principais */}
            <form
              className="adm-form"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () => updateBooking(detail),
                  'Agendamento atualizado.',
                  () => setDetail(null)
                );
              }}
            >
              <div className="adm-form-section-title">
                <h4>Dados do agendamento</h4>
              </div>
              <div className="adm-form-grid">
                <Field label="Nome da cliente">
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={detail.name}
                    onChange={(e) => setDetail({ ...detail, name: e.target.value })}
                  />
                </Field>
                <Field label="Telefone">
                  <input
                    value={detail.phone}
                    onChange={(e) => setDetail({ ...detail, phone: e.target.value })}
                  />
                </Field>
                <Field label="Data">
                  <input
                    type="date"
                    required
                    value={detail.date}
                    onInput={(e) => setDetail({ ...detail, date: e.currentTarget.value })}
                  />
                </Field>
                <Field label="Horário">
                  <span>{detail.time || 'Selecione uma vaga abaixo'}</span>
                </Field>
              </div>
              <Availability date={detail.date} serviceId={detail.serviceId} excludeId={detail.id} value={detail.time} onChange={time=>setDetail({...detail,time})} onReady={setDetailReady}/>
              <Field label="Situação">
                <select
                  value={detail.status}
                  onChange={(e) => setDetail({ ...detail, status: e.target.value as Status })}
                >
                  {Object.entries(labels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Observações">
                <textarea
                  maxLength={1000}
                  value={detail.notes}
                  onChange={(e) => setDetail({ ...detail, notes: e.target.value })}
                />
              </Field>
              <div className="adm-actions">
                <button disabled={busy || (active(detail.status) && !detailReady)} className="adm-button primary">
                  Salvar alterações
                </button>
              </div>
            </form>

            {/* Seção Financeira e Pagamentos */}
            <section className="adm-payment-section" id="admin-payment">
              <h3>Pagamento</h3>
              <div className="adm-payment-summary">
                <span>
                  Recebido <strong>{money(paid(detail))}</strong>
                </span>
                <span>
                  Saldo <strong>{money(Math.max(0, detail.amount - paid(detail)))}</strong>
                </span>
              </div>
              {active(detail.status) && paid(detail) < detail.amount && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(
                      () =>
                        recordPayment(detail.id, {
                          amount: Number(payAmount),
                          date: payDate,
                          method: payMethod,
                        }),
                      'Pagamento registrado.',
                      () => setDetail(null)
                    );
                  }}
                >
                  <div className="adm-form-grid">
                    <Field label="Valor recebido (R$)">
                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        max={detail.amount - paid(detail)}
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                      />
                    </Field>
                    <Field label="Data do recebimento">
                      <input
                        type="date"
                        required
                        max={todayISO()}
                        value={payDate}
                        onInput={(e) => setPayDate(e.currentTarget.value)}
                      />
                    </Field>
                  </div>
                  <Field label="Forma de pagamento">
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      {['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito'].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </Field>
                  <button disabled={busy} className="adm-button primary full">
                    <Wallet size={16} /> Registrar recebimento
                  </button>
                </form>
              )}
              {detail.payments.map((p) => (
                <p className="adm-payment-line" key={p.id}>
                  {dateLabel(p.date)} • {p.method}
                  <strong>{money(p.amount)}</strong>
                </p>
              ))}
              <p className="adm-help">
                Concluir o atendimento não registra dinheiro automaticamente. Registre o
                recebimento para atualizar o financeiro.
              </p>
            </section>

            {/* Histórico */}
            <section className="adm-history">
              <h3>Histórico</h3>
              {detail.history
                .slice()
                .reverse()
                .map((h, i) => (
                  <div key={i}>
                    <i />
                    <span>
                      {h.message}
                      <small>
                        {new Date(h.at).toLocaleString('pt-BR', {
                          timeZone: 'America/Fortaleza',
                        })}
                      </small>
                    </span>
                  </div>
                ))}
            </section>
          </div>
        </Modal>
      )}

      {confirm && (
        <Modal
          title={
            confirm.status === 'cancelado' ? 'Cancelar agendamento?' : 'Concluir atendimento?'
          }
          close={() => setConfirm(null)}
        >
          <div className="adm-form">
            <p>
              {confirm.appointment.name} • {confirm.appointment.serviceName}
            </p>
            <p className="adm-help">
              {confirm.status === 'cancelado'
                ? 'O horário será liberado. O histórico e os pagamentos já recebidos serão mantidos.'
                : 'O atendimento será contado como concluído. Os pagamentos continuam sendo registrados separadamente.'}
            </p>
            <div className="adm-actions">
              <button className="adm-button" onClick={() => setConfirm(null)}>
                Voltar
              </button>
              <button
                disabled={busy}
                className="adm-button primary"
                onClick={() =>
                  run(
                    () =>
                      updateBooking({
                        ...confirm.appointment,
                        status: confirm.status,
                      }),
                    'Situação atualizada.',
                    () => {
                      setConfirm(null);
                      setDetail(null);
                    }
                  )
                }
              >
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editService && (
        <Modal title="Editar serviço" close={() => setEditService(null)}>
          <form
            className="adm-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => saveService(editService),
                'Serviço atualizado.',
                () => setEditService(null)
              );
            }}
          >
            <Field label="Nome">
              <input
                required
                value={editService.name}
                onChange={(e) => setEditService({ ...editService, name: e.target.value })}
              />
            </Field>
            <Field label="Descrição">
              <textarea
                required
                value={editService.desc}
                onChange={(e) => setEditService({ ...editService, desc: e.target.value })}
              />
            </Field>
            <div className="adm-form-grid">
              <Field label="Preço (R$)">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={editService.price}
                  onChange={(e) =>
                    setEditService({ ...editService, price: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Duração (minutos)">
                <input
                  required
                  disabled={editService.category === 'natural'}
                  type="number"
                  min="15"
                  max="240"
                  value={editService.duration}
                  onChange={(e) =>
                    setEditService({ ...editService, duration: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
            <label className="adm-check">
              <input
                type="checkbox"
                checked={editService.active}
                onChange={(e) => setEditService({ ...editService, active: e.target.checked })}
              />
              Disponível para novas reservas
            </label>
            <button disabled={busy} className="adm-button primary">
              Salvar serviço
            </button>
          </form>
        </Modal>
      )}

      {editAddon && (
        <Modal title="Editar adicional" close={() => setEditAddon(null)}>
          <form
            className="adm-form"
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () => saveAddon(editAddon),
                'Adicional atualizado.',
                () => setEditAddon(null)
              );
            }}
          >
            <Field label="Nome">
              <input
                required
                value={editAddon.name}
                onChange={(e) => setEditAddon({ ...editAddon, name: e.target.value })}
              />
            </Field>
            <Field label="Preço (R$)">
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={editAddon.price}
                onChange={(e) =>
                  setEditAddon({ ...editAddon, price: Number(e.target.value) })
                }
              />
            </Field>
            <button disabled={busy} className="adm-button primary">
              Salvar adicional
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function BookingHoursEditor({
  hours,
  busy,
  save,
}: {
  hours: BookingHours;
  busy: boolean;
  save: (hours: BookingHours) => void;
}) {
  const [draft, setDraft] = useState<BookingHours>({ ...hours, natural: [...naturalTimes] });
  const [pending, setPending] = useState<Record<"cabine" | "clareamento" | "cabineSaturday" | "cabineSunday", string>>({
    cabineSaturday: '',
    cabineSunday: '',
    cabine: '',
    clareamento: '',
  });
  useEffect(() => setDraft({ ...hours, natural: [...naturalTimes] }), [hours]);
  const groups: ["cabine" | "clareamento" | "cabineSaturday" | "cabineSunday", string, string][] = [
    ['cabine', 'Cabine — dias de semana', 'Horários de segunda a sexta'],
    ['cabineSaturday', 'Cabine — sábado', 'Horários de sábado'],
    ['cabineSunday', 'Cabine — domingo', 'Horários de domingo'],
    ['clareamento', 'Clareamento', '08h às 20h30'],
  ];
  function validTime(key: "cabine" | "clareamento" | "cabineSaturday" | "cabineSunday", value: string) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return false;
    const minute = Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
    return minute % 5 === 0 && (minute >= 480 && minute <= 1230);
  }
  function add(key: "cabine" | "clareamento" | "cabineSaturday" | "cabineSunday") {
    const value = pending[key];
    if (!validTime(key, value) || (draft[key] || defaultBookingHours[key] || []).includes(value)) return;
    setDraft({ ...draft, [key]: [...(draft[key] || defaultBookingHours[key] || []), value].sort() });
    setPending({ ...pending, [key]: '' });
  }
  return (
    <section className="adm-card">
      <div className="adm-card-heading">
        <div>
          <h2>Disponibilidade para as clientes</h2>
          <p>Bronze natural: 12 vagas fixas por dia, sem escolha de horário.</p>
        </div>
        <Clock size={19} />
      </div>
      <div className="adm-form"><h3>Dias de funcionamento</h3><p>Marque os dias em que deseja abrir, incluindo segunda-feira.</p><div className="adm-hour-chips">{['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'].map((label, day) => <label key={day} className="adm-hour-chip"><input type="checkbox" checked={(draft.openDays || [0,2,3,4,5,6]).includes(day)} onChange={e => { const days=draft.openDays || [0,2,3,4,5,6]; setDraft({...draft, openDays:e.target.checked ? [...days,day].sort() : days.filter(d=>d!==day)}); }} />{label}</label>)}</div></div>
      <div className="adm-settings-hours">
        <section>
          <h3>Bronze natural</h3>
          <small>Uma reserva por vaga em cada dia</small>
          <div className="adm-hour-chips">
            {naturalTimes.map((t) => (
              <span className="adm-hour-chip" key={t}>
                {t}
              </span>
            ))}
          </div>
        </section>
        {groups.map(([key, label, range]) => (
          <section key={key}>
            <div>
              <h3>{label}</h3>
              <small>{range}</small>
            </div>
            <div className="adm-hour-chips">
              {(draft[key] || defaultBookingHours[key] || []).map((t) => (
                <button
                  type="button"
                  className="adm-hour-chip"
                  key={t}
                  onClick={() => setDraft({ ...draft, [key]: (draft[key] || defaultBookingHours[key] || []).filter((x) => x !== t) })}
                  aria-label={`Remover ${t} de ${label}`}
                >
                  {t}
                  <X size={13} />
                </button>
              ))}
            </div>
            <div className="adm-hour-add">
              <Field label={`Adicionar horário (${label})`}>
                <input
                  type="time"
                  step={300}
                  min="08:00"
                  max="20:30"
                  value={pending[key]}
                  onInput={(e) => setPending({ ...pending, [key]: e.currentTarget.value })}
                />
              </Field>
              <button
                type="button"
                className="adm-button"
                onClick={() => add(key)}
                disabled={!validTime(key, pending[key]) || (draft[key] || defaultBookingHours[key] || []).includes(pending[key])}
              >
                Adicionar
              </button>
            </div>
          </section>
        ))}
      </div>
      <div className="adm-form">
        <p className="adm-help">
          Sábado: bronze natural das 08h às 11h e das 14h às 16h. Domingo: das 08h às 12h.
        </p>
        <button
          type="button"
          disabled={busy}
          className="adm-button primary"
          onClick={() => save({ ...draft, natural: [...naturalTimes] })}
        >
          Salvar disponibilidade
        </button>
      </div>
    </section>
  );
}

function NewBooking({ initialDate, initialService, initialTime, error,
  hours,
  services,
  addons,
  busy,
  close,
  save,
}: {
  initialDate:string; initialService?:string; initialTime?:string; error:string;
  hours: BookingHours;
  services: Service[];
  addons: Addon[];
  busy: boolean;
  close: () => void;
  save: (input: any) => void;
}) {
  const [input, setInput] = useState({
    name: '',
    phone: '',
    serviceId: initialService || services.find((s) => s.active)?.id || '',
    date: initialDate,
    time: initialTime || '',
    notes: '',
    addons: [] as string[],
  });
  const service = services.find((s) => s.id === input.serviceId);
  const [slotReady,setSlotReady]=useState(false);
  const total =
    (service?.price || 0) +
    addons.filter((a) => input.addons.includes(a.id)).reduce((v, a) => v + a.price, 0);
  return (
    <Modal title="Novo agendamento" close={close}>
      {error && <p className="adm-slot-error" role="alert">{error}</p>}
      <form
        className="adm-form"
        onSubmit={(e) => {
          e.preventDefault();
          save(input);
        }}
      >
        <div className="adm-form-grid">
          <Field label="Nome da cliente">
            <input
              required
              autoFocus
              minLength={2}
              maxLength={120}
              placeholder="Nome completo"
              value={input.name}
              onChange={(e) => setInput({ ...input, name: e.target.value })}
            />
          </Field>
          <Field label="Telefone com DDD">
            <input
              type="tel"
              placeholder="(88) 99999-9999"
              value={input.phone}
              onChange={(e) => setInput({ ...input, phone: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Serviço">
          <select
            required
            value={input.serviceId}
            onChange={(e) => {
              const s = services.find((s) => s.id === e.target.value)!;
              setInput({
                ...input,
                serviceId: s.id,
                time: hoursForService(hours,s.category,new Date(input.date+'T12:00:00').getDay(),s.id)[0] || '',
              });
            }}
          >
            {services
              .filter((s) => s.active)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {money(s.price)}
                </option>
              ))}
          </select>
        </Field>
        <div className="adm-form-grid">
          <Field label="Data">
            <input
              type="date"
              required
              value={input.date}
              onInput={(e) => setInput({ ...input, date: e.currentTarget.value })}
            />
          </Field>
        </div>
        <Availability date={input.date} serviceId={input.serviceId} value={input.time} onChange={time=>setInput({...input,time})} onReady={setSlotReady}/>
        <Field label="Observações">
          <textarea
            maxLength={1000}
            value={input.notes}
            onChange={(e) => setInput({ ...input, notes: e.target.value })}
            placeholder="Preferências ou detalhes do atendimento"
          />
        </Field>
        <fieldset className="adm-addon-checks">
          <legend>Adicionais</legend>
          {addons.map((a) => (
            <label className="adm-check" key={a.id}>
              <input
                type="checkbox"
                checked={input.addons.includes(a.id)}
                onChange={(e) =>
                  setInput({
                    ...input,
                    addons: e.target.checked
                      ? [...input.addons, a.id]
                      : input.addons.filter((x) => x !== a.id),
                  })
                }
              />
              {a.name} <span>{money(a.price)}</span>
            </label>
          ))}
        </fieldset>
        <div className="adm-new-total">
          <span>Valor do atendimento</span>
          <strong>{money(total)}</strong>
        </div>
        <p className="adm-help">
          A disponibilidade é validada ao salvar. Uma reserva nova entra como pendente.
        </p>
        <button disabled={busy || !service || !slotReady} className="adm-button primary full">
          {busy ? 'Salvando…' : 'Criar agendamento'}
          <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}

function MiniCalendar({
  month,
  day,
  rows,
  onDay,
  onShift,
}: {
  month: string;
  day: string;
  rows: Appointment[];
  onDay: (d: string) => void;
  onShift: (n: number) => void;
}) {
  const start = new Date(month + '-01T12:00:00');
  const count = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  return (
    <div className="adm-calendar">
      <div className="adm-calendar-title">
        <button aria-label="Mês anterior da agenda" onClick={() => onShift(-1)}>
          <ChevronLeft size={16} />
        </button>
        <strong>{monthName(month)}</strong>
        <button aria-label="Próximo mês da agenda" onClick={() => onShift(1)}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="adm-calendar-grid">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((s, i) => (
          <span key={'w' + i}>{s}</span>
        ))}
        {Array.from({ length: start.getDay() }, (_, i) => (
          <span key={'blank' + i} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const d = month + '-' + String(i + 1).padStart(2, '0');
          const has = rows.some((a) => a.date === d && active(a.status));
          return (
            <button
              key={d}
              aria-label={dateLabel(d)}
              className={
                (day === d ? 'selected ' : '') +
                (d === todayISO() ? 'today ' : '') +
                (has ? 'has-booking' : '')
              }
              onClick={() => onDay(d)}
            >
              {i + 1}
              {has && <i />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RevenueChart({ rows, month }: { rows: Appointment[]; month: string }) {
  const count = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const data = Array.from({ length: count }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${month}-${String(dayNum).padStart(2, '0')}`;
    const amount = rows.reduce((acc, a) => {
      const match = a.payments.filter((p) => p.date === dateStr);
      return acc + match.reduce((sum, p) => sum + p.amount, 0);
    }, 0);
    return {
      day: dayNum,
      date: dateStr,
      amount,
    };
  });

  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="adm-chart-body">
      <div className="adm-chart-meta">
        <span>Total recebido em {monthName(month)}</span>
        <strong>{money(total)}</strong>
      </div>
      {total === 0 ? (
        <div className="adm-chart-empty">
          <p>Nenhum recebimento registrado neste mês.</p>
        </div>
      ) : (
        <div className="adm-recharts-wrap">
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="adm-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b57949" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#b57949" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee8e2" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#9b938a', fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: '#eee8e2' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#9b938a', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v === 0 ? '0' : `R$ ${v}`)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="adm-chart-tooltip">
                        <span className="adm-tooltip-date">{dateLabel(item.date)}</span>
                        <strong className="adm-tooltip-val">{money(item.amount)}</strong>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#ae7549"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#adm-chart-gradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
