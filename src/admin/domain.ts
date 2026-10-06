export type Status = 'pendente'|'confirmado'|'concluido'|'cancelado'|'faltou';
export type Category = 'natural'|'cabine'|'clareamento';
export interface Service { id:string; name:string; price:number; duration:number; category:Category; active:boolean; desc:string }
export interface Addon { id:string; name:string; price:number }
export interface Payment { id:string; amount:number; date:string; method:string }
export interface Appointment { id:string; name:string; phone:string; serviceId:string; serviceName:string; date:string; time:string; duration:number; category:Category; amount:number; status:Status; notes:string; addons:string[]; payments:Payment[]; history:{at:string;message:string}[]; createdAt:string }
export interface Block { id:string; date:string; time:string; reason:string }
export const labels:Record<Status,string> = {pendente:'Pendente',confirmado:'Confirmado',concluido:'Concluído',cancelado:'Cancelado',faltou:'Não compareceu'};
export const seedServices:Service[] = [
 {id:'bronze-turbo',name:'Bronze Turbo',price:75,duration:180,category:'natural',active:true,desc:'Parafina, 2 ativadores e banho de lua clareador.'},
 {id:'power',name:'Bronze Power',price:80,duration:180,category:'natural',active:true,desc:'Giga óleo, 3 ativadores, acelerador e banho de lua clareador.'},
 {id:'turbinado',name:'Bronze Turbinado',price:85,duration:180,category:'natural',active:true,desc:'Giga bronze, 3 ativadores, acelerador e intensificador.'},
 {id:'diamante-premium',name:'Bronze Diamante Premium',price:85,duration:180,category:'natural',active:true,desc:'Ativador diamante premium e banho de lua clareador.'},
 {id:'solazul',name:'Bronze Sol Azul',price:120,duration:45,category:'cabine',active:true,desc:'Ativador, intensificador, fixador, acelerador e banho de lua.'},
 {id:'solazul-turbo',name:'Bronze Sol Azul Turbo',price:130,duration:45,category:'cabine',active:true,desc:'3 ativadores, intensificador, fixador, acelerador e banho de lua.'},
 {id:'duplo',name:'Bronze Duplo',price:145,duration:120,category:'cabine',active:true,desc:'Bronze artificial turbo + bronze natural no sol.'},
 {id:'clareamento-corporal',name:'Clareamento Corporal',price:40,duration:30,category:'clareamento',active:true,desc:'Clareamento de 4 áreas do corpo e rosto.'},
 {id:'banho-lua-clareador',name:'Banho de Lua Clareador',price:75,duration:45,category:'clareamento',active:true,desc:'Banho de lua com ação clareadora.'},
];
export const seedAddons:Addon[] = [{id:'clareamento-area',name:'Clareamento de Área',price:10},{id:'argiloterapia-facial',name:'Argiloterapia Facial',price:10},{id:'tatuagem-temporaria',name:'Tatuagem Temporária',price:5},{id:'tattoo-solar',name:'Tattoo Solar',price:5},{id:'intensificacao-alcinha',name:'Intensificação de Alcinha',price:15}];
export const times = ['08:00','09:00','10:00','11:00','15:00','16:00','17:00','18:00','19:00'];
export const naturalTimes = ['08:00','08:10','08:15','08:30','08:45','09:00','09:10','09:15','09:30','09:35','09:40'];
export const periods = ['Manhã (08h-11h)','Tarde (15h-19h)'];
export const money = (n:number) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function todayISO() { return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
export const dateLabel = (s:string) => s.split('-').reverse().join('/');
export const active = (s:string) => !['cancelado','faltou'].includes(s);
export const paid = (a:Appointment) => a.payments.reduce((v,p)=>v+p.amount,0);
const minutes = (s:string) => Number(s.slice(0,2))*60+Number(s.slice(3,5));
export function conflicts(rows:Appointment[],blocks:Block[],candidate:Appointment) {
 if (!active(candidate.status)) return false;
 if (blocks.some(b=>b.date===candidate.date && (b.time==='dia' || b.time===candidate.time || (candidate.category==='natural' && ((b.time===periods[0] && minutes(candidate.time)>=480 && minutes(candidate.time)<660)||(b.time===periods[1] && minutes(candidate.time)>=900 && minutes(candidate.time)<1140))) || (candidate.category!=='natural' && /^\d\d:\d\d$/.test(b.time) && minutes(candidate.time)<minutes(b.time)+60 && minutes(b.time)<minutes(candidate.time)+candidate.duration)))) return true;
 return rows.some(a=>a.id!==candidate.id && a.date===candidate.date && active(a.status) && (a.category==='natural' || candidate.category==='natural' ? a.category===candidate.category && a.time===candidate.time : minutes(candidate.time)<minutes(a.time)+a.duration && minutes(a.time)<minutes(candidate.time)+candidate.duration));
}
export function validateBooking(a:Appointment,services:Service[],allowPast=true) {
 if (a.name.trim().length<2 || a.name.length>120) throw new Error('Informe um nome com pelo menos 2 letras.');
 const service=services.find(s=>s.id===a.serviceId);
 if (!service || !service.active) throw new Error('Serviço indisponível.');
 const d=new Date(a.date+'T12:00:00');
 if (!/^\d{4}-\d{2}-\d{2}$/.test(a.date) || !Number.isFinite(d.getTime()) || d.toISOString().slice(0,10)!==a.date) throw new Error('Data inválida.');
 if (d.getDay()===1) throw new Error('O estúdio está fechado na segunda-feira.');
 if (!allowPast && a.date<todayISO()) throw new Error('Escolha uma data a partir de hoje.');
 if (!(service.category==='natural'?naturalTimes:times).includes(a.time)) throw new Error('Horário inválido.');
 if (service.category!=='natural' && minutes(a.time)+service.duration>20*60) throw new Error('Atendimento ultrapassa o horário de fechamento (20h).');
 if (a.phone && !/^\d{10,13}$/.test(a.phone.replace(/\D/g,''))) throw new Error('Informe um telefone válido com DDD.');
}
export function monthlySummary(rows:Appointment[],month:string) {
 const inMonth=rows.filter(a=>a.date.startsWith(month));
 return { received:rows.reduce((v,a)=>v+a.payments.filter(p=>p.date.startsWith(month)).reduce((s,p)=>s+p.amount,0),0), expected:inMonth.filter(a=>active(a.status)).reduce((v,a)=>v+Math.max(0,a.amount-paid(a)),0), completed:inMonth.filter(a=>a.status==='concluido').length, revenue:inMonth.filter(a=>a.status==='concluido').reduce((v,a)=>v+a.amount,0), bookings:inMonth.filter(a=>active(a.status)).length };
}
