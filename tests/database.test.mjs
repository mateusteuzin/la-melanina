import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const admin='00000000-0000-4000-8000-000000000001';
let date; let id;
const query=(sql,args=[])=>db.query(sql,args);
const role=async(r,user='')=>{await db.exec('reset role');await query("select set_config('test.uid',$1,false)",[user]);await db.exec('set role '+r);};
const input=(time='09:00',serviceId='duplo')=>({name:'Cliente de teste',phone:'88999999999',serviceId,date,time,notes:'Teste',addons:[],amount:1,status:'concluido'});
before(async()=>{
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 await db.exec(readFileSync(new URL('../supabase/001_admin.sql',import.meta.url),'utf8'));
 await query('insert into auth.users values($1)',[admin]);await query('insert into public.admin_members values($1)',[admin]);
 const r=await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+1,current_date+7,interval '1 day') d where extract(dow from d)<>1 limit 1");date=r.rows[0].d;
});
after(()=>db.close());
test('catálogo público disponível; dados de clientes privados',async()=>{
 await role('anon');assert.equal((await query('select count(*) n from public.services')).rows[0].n,9);
 await assert.rejects(query('select * from public.appointments'),/permission denied/);
 await assert.rejects(query('select * from public.blocks'),/permission denied/);
 await assert.rejects(query('select * from public.admin_members'),/permission denied/);
});
test('reserva pública calcula preço real e impede elevar situação',async()=>{
 await role('anon');const r=await query('select public.create_booking($1::jsonb,false) id',[JSON.stringify(input())]);id=r.rows[0].id;
 await role('authenticated',admin);const a=(await query('select data from public.appointments where id=$1',[id])).rows[0].data;
 assert.equal(a.amount,145);assert.equal(a.status,'pendente');assert.equal(a.duration,120);
});
test('reserva e remarcação respeitam a duração; consulta só revela horários',async()=>{
 await role('anon');await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify(input('10:00','solazul'))]),/conflito/);
 const r=await query('select public.unavailable_times($1,$2) times',[date,'solazul']);assert.ok(r.rows[0].times.includes('10:00'));assert.ok(!r.rows[0].times.includes('11:00'));
 assert.ok(!JSON.stringify(r.rows).includes('Cliente'));
});
test('usuário autenticado comum não acessa admin nem cria bloqueios',async()=>{
 await role('authenticated','00000000-0000-4000-8000-000000000002');assert.equal((await query('select * from public.appointments')).rows.length,0);
 await assert.rejects(query('select public.update_booking($1,$2::jsonb)',[id,JSON.stringify({status:'concluido'})]),/administrativo/);
 await assert.rejects(query("select public.add_block($1,'dia','Folga')",[date]),/administrativo/);
 await assert.rejects(query('select public.create_booking($1::jsonb,true)',[JSON.stringify(input())]),/administrativo/);
 await assert.rejects(query('insert into public.admin_members values($1)',[admin]),/permission denied/);
});
test('admin registra sinal; sobrepagamento rejeitado e conclusão preserva preço',async()=>{
 await role('authenticated',admin);
 const today=(await query("select to_char((now() at time zone 'America/Fortaleza')::date,'YYYY-MM-DD') d")).rows[0].d;
 await query("select public.record_payment($1,50,$2,'Pix')",[id,today]);
 await assert.rejects(query("select public.record_payment($1,100,$2,'Pix')",[id,today]),/saldo/);
 await query('select public.update_booking($1,$2::jsonb)',[id,JSON.stringify({status:'concluido',amount:1,payments:[]})]);
 const a=(await query('select data from public.appointments where id=$1',[id])).rows[0].data;
 assert.equal(a.amount,145);assert.equal(a.payments[0].amount,50);assert.equal(a.status,'concluido');assert.equal(a.history.length,3);
});
test('bloqueio não sobrepõe atendimento; cancelamento preserva pagamento e libera horário',async()=>{
 await role('authenticated',admin);await assert.rejects(query("select public.add_block($1,'dia','Folga')",[date]),/atendimento/);
 await query('select public.update_booking($1,$2::jsonb)',[id,JSON.stringify({status:'cancelado'})]);
 const a=(await query('select data from public.appointments where id=$1',[id])).rows[0].data;assert.equal(a.payments[0].amount,50);
 await query("select public.add_block($1,'10:00','Compromisso')",[date]);
 await role('anon');await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify(input())]),/conflito/);
 const r=await query('select public.create_booking($1::jsonb,false)',[JSON.stringify(input('11:00','solazul'))]);assert.ok(r.rows.length);
});
test('adicionais duplicados e datas inválidas são rejeitados',async()=>{
 await role('anon');await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input('15:00','solazul'),addons:['tattoo-solar','tattoo-solar']})]),/duplicados/);
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input(),date:'2026-02-31'})]),/out of range/);
});
test('horário ausente é rejeitado e flag admin nula continua sendo solicitação pública',async()=>{
 await role('anon');
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input('15:00','bronze-turbo'),time:null})]),/Horário/);
 await assert.rejects(query('select public.create_booking($1::jsonb,null)',[JSON.stringify({...input('15:00','solazul'),phone:''})]),/telefone/i);
});
test('natural permite chegadas próximas, reserva uma cliente por horário e bloqueia a manhã',async()=>{
 await role('anon');
 const n={...input('08:10','bronze-turbo'),phone:'88911111111'};
 await query('select public.create_booking($1::jsonb,false)',[JSON.stringify(n)]);
 await query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...n,time:'08:15'})]);
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify(n)]),/conflito/);
 const unavailable=(await query('select public.unavailable_times($1,$2) times',[date,'bronze-turbo'])).rows[0].times;
 assert.ok(unavailable.includes('08:10'));assert.ok(unavailable.includes('08:15'));assert.ok(!unavailable.includes('08:30'));
 await role('authenticated',admin);
 await assert.rejects(query("select public.add_block($1,'Manhã (08h-11h)','Pausa')",[date]),/atendimento/);
});
