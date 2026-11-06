import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const db=new PGlite();
const admin='00000000-0000-4000-8000-000000000001';
let date; let periodDate; let id;
const query=(sql,args=[])=>db.query(sql,args);
const migration=(name)=>readFileSync(new URL(`../supabase/${name}`,import.meta.url),'utf8').replace(/^\uFEFF/,'');
const role=async(r,user='')=>{await db.exec('reset role');await query("select set_config('test.uid',$1,false)",[user]);await db.exec('set role '+r);};
const input=(time='09:00',serviceId='duplo')=>({name:'Cliente de teste',phone:'88999999999',serviceId,date,time,notes:'Teste',addons:[],amount:1,status:'concluido'});
before(async()=>{
 await db.exec(`create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
 await db.exec(migration('001_admin.sql'));
 await db.exec(migration('002_booking_hours.sql'));
 await db.exec(migration('003_natural_daily_slots.sql'));
 await db.exec(migration('004_reliable_availability_blocks.sql'));
 await query('insert into auth.users values($1)',[admin]);await query('insert into public.admin_members values($1)',[admin]);
 const r=await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+1,current_date+7,interval '1 day') d where extract(dow from d)<>1 limit 1");date=r.rows[0].d;
 const p=await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+8,current_date+20,interval '1 day') d where extract(dow from d)<>1 limit 1");periodDate=p.rows[0].d;
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
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input('15:00','bronze-turbo'),time:null})]),/vaga|horário/i);
 await assert.rejects(query('select public.create_booking($1::jsonb,null)',[JSON.stringify({...input('15:00','solazul'),phone:''})]),/telefone/i);
});
test('bronze natural reserva vagas numeradas e aceita bloquear uma vaga',async()=>{
 await role('anon');
 const n={...input('Vaga 1','bronze-turbo'),phone:'88911111111'};
 await query('select public.create_booking($1::jsonb,false)',[JSON.stringify(n)]);
 await query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...n,time:'Vaga 2'})]);
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify(n)]),/conflito/);
 const unavailable=(await query('select public.unavailable_times($1,$2) times',[date,'bronze-turbo'])).rows[0].times;
 assert.ok(unavailable.includes('Vaga 1'));assert.ok(unavailable.includes('Vaga 2'));
 await role('authenticated',admin);
 await query("select public.add_block($1,'Vaga 3','Pausa')",[date]);
 await role('anon');
 const afterBlock=(await query('select public.unavailable_times($1,$2) times',[date,'bronze-turbo'])).rows[0].times;
 assert.ok(afterBlock.includes('Vaga 1'));assert.ok(afterBlock.includes('Vaga 2'));assert.ok(afterBlock.includes('Vaga 3'));
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...n,time:'Vaga 3'})]),/conflito/);
});
test('bloqueios de período e horário ficam indisponíveis na agenda pública',async()=>{
 await role('authenticated',admin);
 await query("select public.add_block($1,'Manhã (08h-11h)','Pausa')",[periodDate]);
 await query("select public.add_block($1,'15:10','Compromisso')",[periodDate]);
 await role('anon');
 const timed=(await query('select public.unavailable_times($1,$2) times',[periodDate,'solazul'])).rows[0].times;
 assert.ok(timed.includes('08:00'));assert.ok(timed.includes('11:00'));assert.ok(timed.includes('15:00'));assert.ok(timed.includes('16:00'));assert.ok(!timed.includes('17:00'));
 const natural=(await query('select public.unavailable_times($1,$2) times',[periodDate,'bronze-turbo'])).rows[0].times;
 assert.ok(!natural.includes('Vaga 1'));
});

test('weekly configuration supports Monday, weekend slots and 20:30 bookings',async()=>{
 await role('authenticated',admin);
 await db.exec('reset role');
 await db.exec(migration('005_flexible_weekly_hours.sql'));
 await role('authenticated',admin);
 const config=(await query('select public.get_booking_hours() h')).rows[0].h;
 assert.deepEqual(config.cabine,['14:30','15:30','16:30','17:30','18:30','19:30','20:30']);
 assert.deepEqual(config.cabineSaturday,['14:00','15:00','16:00','17:00']);
 assert.deepEqual(config.cabineSunday,['08:00','09:00','10:00','11:00']);
 const monday=(await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+21,current_date+28,interval '1 day') d where extract(dow from d)=1 limit 1")).rows[0].d;
 await role('anon');
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input('20:30','solazul'),date:monday})]),/fechado/);
 await role('authenticated',admin);
 await query('select public.save_booking_hours($1::jsonb)',[JSON.stringify({...config,openDays:[0,1,2,3,4,5,6]})]);
 await role('anon');
 await query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input('20:30','solazul'),date:monday})]);
 const taken=(await query('select public.unavailable_times($1,$2) times',[monday,'solazul'])).rows[0].times;
 assert.ok(taken.includes('20:30'));
 for(const [dow,valid,invalid] of [[6,'14:00','14:30'],[0,'08:00','20:30']]) {
  const day=(await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+30,current_date+37,interval '1 day') d where extract(dow from d)=$1 limit 1",[dow])).rows[0].d;
  await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input(invalid,'solazul'),date:day})]),/dispon/);
  await query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...input(valid,'solazul'),date:day})]);
 }
 await role('authenticated',admin);
 await assert.rejects(query('select public.save_booking_hours($1::jsonb)',[JSON.stringify({...config,openDays:[7]})]),/semana/);
 await query('select public.save_booking_hours($1::jsonb)',[JSON.stringify({...config,openDays:[]})]);
 await role('anon');
 const closed=(await query('select public.unavailable_times($1,$2) times',[monday,'solazul'])).rows[0].times;
 assert.deepEqual(closed,config.cabine);
});

test('migração restaura manhãs da cabine e preserva bloqueios da tarde',async()=>{
 await role('postgres');
 await db.exec(migration('005_flexible_weekly_hours.sql'));
 await db.exec(migration('006_restore_cabin_mornings.sql'));
 await db.exec(migration('006_restore_cabin_mornings.sql'));
 const hours=(await query('select data from public.booking_hours where id')).rows[0].data;
 for (const key of ['cabine','cabineSaturday']) {
  for (const time of ['08:00','09:00','10:00','11:00']) assert.ok(hours[key].includes(time));
  assert.equal(hours[key].length,new Set(hours[key]).size);
 }
 assert.ok(hours.cabine.includes('20:30'));
 await role('authenticated',admin);
 const future=(await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+60,current_date+66,interval '1 day') d where extract(dow from d)=2 limit 1")).rows[0].d;
 await query("select public.add_block($1,'Tarde (15h-19h)','Pausa')",[future]);
 await role('anon');
 const times=(await query('select public.unavailable_times($1,$2) times',[future,'solazul'])).rows[0].times;
 for (const time of ['08:00','09:00','10:00','11:00']) assert.ok(!times.includes(time));
 assert.ok(times.includes('15:30'));
});

test('Bronze Duplo só aceita manhã na reserva e remarcação',async()=>{
 await role('postgres');
 await db.exec(migration('007_duplo_morning_only.sql'));
 const future=(await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+80,current_date+86,interval '1 day') d where extract(dow from d)=2 limit 1")).rows[0].d;
 await role('anon');
 const booking={...input('09:00'),date:future,phone:'88922223333'};
 const created=(await query('select public.create_booking($1::jsonb,false) id',[JSON.stringify(booking)])).rows[0].id;
 await assert.rejects(query('select public.create_booking($1::jsonb,false)',[JSON.stringify({...booking,time:'18:30'})]),/manhã/);
 const times=(await query('select public.unavailable_times($1,$2) times',[future,'duplo'])).rows[0].times;
 assert.ok(times.includes('18:30'));assert.ok(!times.includes('11:00'));
 await role('authenticated',admin);
 await assert.rejects(query('select public.update_booking($1,$2::jsonb)',[created,JSON.stringify({time:'18:30'})]),/manhã/);
 await assert.rejects(query('select public.create_booking($1::jsonb,true)',[JSON.stringify({...booking,time:'18:30'})]),/manhã/);
});

test('agenda administrativa consulta vagas, exclui a própria reserva e protege acesso',async()=>{
 await role('postgres');await db.exec(migration('008_admin_availability.sql'));
 const date=(await query("select to_char(d,'YYYY-MM-DD') d from generate_series(current_date+100,current_date+106,interval '1 day') d where extract(dow from d)=2 limit 1")).rows[0].d;
 await role('anon');await assert.rejects(query('select public.admin_available_times($1,$2,null)',[date,'duplo']),/permission denied/);
 await role('authenticated','00000000-0000-4000-8000-000000000002');await assert.rejects(query('select public.admin_available_times($1,$2,null)',[date,'duplo']),/administrativo/);
 await role('authenticated',admin);
 const booking={...input('09:00'),date};
 const id=(await query('select public.create_booking($1::jsonb,true) id',[JSON.stringify(booking)])).rows[0].id;
 const available=async(service='duplo',exclude=null)=>(await query('select public.admin_available_times($1,$2,$3) times',[date,service,exclude])).rows[0].times;
 assert.ok(!(await available()).includes('09:00'));
 assert.ok((await available('duplo',id)).includes('09:00'));
 assert.ok(!(await available('duplo',id)).includes('18:30'));
 assert.ok(!(await available('solazul')).includes('10:00'));
 await query("select public.add_block($1,'15:30','Pausa')",[date]);
 assert.ok(!(await available('solazul')).includes('15:30'));
 assert.ok((await available('solazul')).includes('18:30'));
 await query('select public.update_booking($1,$2::jsonb)',[id,JSON.stringify({time:'11:00'})]);
 assert.ok((await available()).includes('09:00'));
 await role('postgres');
 await query("update public.appointments set data=jsonb_set(data,'{time}','\"18:30\"'::jsonb) where id=$1",[id]);
 await role('authenticated',admin);
 await query('select public.update_booking($1,$2::jsonb)',[id,JSON.stringify({status:'cancelado'})]);
});
