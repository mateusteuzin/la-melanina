import { createClient } from '@supabase/supabase-js';
import type { Appointment, Service, Addon, Block, Payment } from './domain';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase=url&&key?createClient(url,key):null;
export const demoMode=false;
export interface Data { appointments:Appointment[]; services:Service[]; addons:Addon[]; blocks:Block[] }
function database(){if(!supabase)throw new Error('A conexão com o banco está aguardando a configuração do projeto Supabase.');return supabase;}
function check(error:any){if(error)throw new Error(error.message?.includes('conflito')?'Este horário está ocupado ou bloqueado. Escolha outro.':error.message||'Não foi possível salvar.');}
export async function loadCatalog(){const db=database();const [s,a]=await Promise.all([db.from('services').select('data'),db.from('addons').select('data')]);check(s.error);check(a.error);return {services:(s.data||[]).map(x=>x.data as Service),addons:(a.data||[]).map(x=>x.data as Addon)};}
export async function loadAdmin():Promise<Data>{const db=database();const [catalog,a,b]=await Promise.all([loadCatalog(),db.from('appointments').select('data'),db.from('blocks').select('data')]);check(a.error);check(b.error);return {...catalog,appointments:(a.data||[]).map(x=>x.data as Appointment),blocks:(b.data||[]).map(x=>x.data as Block)};}
export async function unavailable(date:string,serviceId:string):Promise<string[]>{const r=await database().rpc('unavailable_times',{p_date:date,p_service:serviceId});check(r.error);return r.data;}
export type BookingInput={name:string;phone:string;serviceId:string;date:string;time:string;notes:string;addons:string[]};
export async function createBooking(input:BookingInput,admin=false){const r=await database().rpc('create_booking',{p_input:input,p_admin:admin});check(r.error);}
export async function updateBooking(a:Appointment){const r=await database().rpc('update_booking',{p_id:a.id,p_patch:{date:a.date,time:a.time,status:a.status,name:a.name,phone:a.phone,notes:a.notes}});check(r.error);}
export async function recordPayment(id:string,p:Omit<Payment,'id'>){const r=await database().rpc('record_payment',{p_id:id,p_amount:p.amount,p_date:p.date,p_method:p.method});check(r.error);}
export async function saveService(s:Service){if(!Number.isFinite(s.price)||s.price<0||!s.name.trim()||s.duration<15||s.duration>240)throw new Error('Confira nome, preço e duração (15 a 240 minutos).');const r=await database().from('services').upsert({id:s.id,data:s});check(r.error);}
export async function saveAddon(a:Addon){if(!a.name.trim()||!Number.isFinite(a.price)||a.price<0)throw new Error('Confira nome e preço.');const r=await database().from('addons').upsert({id:a.id,data:a});check(r.error);}
export async function addBlock(b:Omit<Block,'id'>){const r=await database().rpc('add_block',{p_date:b.date,p_time:b.time,p_reason:b.reason});check(r.error);}
export async function removeBlock(id:string){const r=await database().from('blocks').delete().eq('id',id);check(r.error);}
export async function isAdmin(){if(!supabase)return false;const {data}=await supabase.auth.getSession();if(!data.session)return false;const r=await supabase.from('admin_members').select('user_id').eq('user_id',data.session.user.id);check(r.error);return !!r.data?.length;}
export async function login(email:string,password:string){const db=database();const r=await db.auth.signInWithPassword({email,password});check(r.error);if(!await isAdmin()){await db.auth.signOut();throw new Error('Sua conta não tem acesso administrativo.');}}
export async function logout(){if(supabase)await supabase.auth.signOut();}
