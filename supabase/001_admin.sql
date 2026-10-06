-- Run once in a NEW Supabase project. No existing tables are dropped.
begin;
create schema if not exists melanina_private;
revoke all on schema melanina_private from public, anon, authenticated;
create table public.admin_members(user_id uuid primary key references auth.users(id) on delete cascade);
create table public.services(id text primary key, data jsonb not null check(data->>'id'=id));
create table public.addons(id text primary key, data jsonb not null check(data->>'id'=id));
create table public.appointments(id uuid primary key, data jsonb not null check((data->>'id')::uuid=id));
create table public.blocks(id uuid primary key, data jsonb not null check((data->>'id')::uuid=id));
create index appointments_date on public.appointments((data->>'date'));
create index blocks_date on public.blocks((data->>'date'));
alter table public.admin_members enable row level security;
alter table public.services enable row level security;
alter table public.addons enable row level security;
alter table public.appointments enable row level security;
alter table public.blocks enable row level security;

create function public.is_studio_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_members where user_id=auth.uid());
$$;
revoke all on function public.is_studio_admin() from public;
grant execute on function public.is_studio_admin() to authenticated;
create policy members_read_self on public.admin_members for select to authenticated using(user_id=auth.uid());
create policy services_read on public.services for select to anon, authenticated using(true);
create policy addons_read on public.addons for select to anon, authenticated using(true);
create policy services_admin on public.services for all to authenticated using(public.is_studio_admin()) with check(public.is_studio_admin());
create policy addons_admin on public.addons for all to authenticated using(public.is_studio_admin()) with check(public.is_studio_admin());
create policy appointments_admin_read on public.appointments for select to authenticated using(public.is_studio_admin());
create policy blocks_admin_read on public.blocks for select to authenticated using(public.is_studio_admin());
create policy blocks_admin_delete on public.blocks for delete to authenticated using(public.is_studio_admin());
revoke all on public.admin_members,public.services,public.addons,public.appointments,public.blocks from anon,authenticated;
grant select on public.services,public.addons to anon,authenticated;
grant select on public.admin_members,public.appointments,public.blocks to authenticated;
grant insert,update on public.services,public.addons to authenticated;
grant delete on public.blocks to authenticated;

create function melanina_private.minute(p_time text) returns integer language sql immutable set search_path='' as $$
 select case when p_time ~ '^\d{2}:\d{2}$' then split_part(p_time,':',1)::int*60+split_part(p_time,':',2)::int else -1 end;
$$;
create function melanina_private.overlap(a jsonb,b jsonb) returns boolean language sql immutable set search_path='' as $$
 select a->>'date'=b->>'date' and a->>'status' not in('cancelado','faltou') and b->>'status' not in('cancelado','faltou') and
 case when a->>'category'='natural' or b->>'category'='natural' then a->>'category'=b->>'category' and a->>'time'=b->>'time'
 else melanina_private.minute(a->>'time') < melanina_private.minute(b->>'time')+(b->>'duration')::int
 and melanina_private.minute(b->>'time') < melanina_private.minute(a->>'time')+(a->>'duration')::int end;
$$;
create function melanina_private.blocked(a jsonb,b jsonb) returns boolean language sql immutable set search_path='' as $$
 select a->>'status' not in('cancelado','faltou') and a->>'date'=b->>'date' and (b->>'time'='dia' or a->>'time'=b->>'time' or
 (a->>'category'='natural' and ((b->>'time'='Manhã (08h-11h)' and melanina_private.minute(a->>'time')>=480 and melanina_private.minute(a->>'time')<660) or
 (b->>'time'='Tarde (15h-19h)' and melanina_private.minute(a->>'time')>=900 and melanina_private.minute(a->>'time')<1140))) or
 (a->>'category'<>'natural' and melanina_private.minute(b->>'time')>=0 and melanina_private.minute(a->>'time')<melanina_private.minute(b->>'time')+60
 and melanina_private.minute(b->>'time')<melanina_private.minute(a->>'time')+(a->>'duration')::int));
$$;
create function melanina_private.validate_booking(a jsonb,p_admin boolean) returns void language plpgsql set search_path='' as $$
declare d date; t text := a->>'time'; category text := a->>'category';
begin
 if char_length(coalesce(trim(a->>'name'),'')) not between 2 and 120 then raise exception 'Informe um nome válido.';end if;
 if coalesce(a->>'phone','')<>'' and a->>'phone' !~ '^\d{10,13}$' then raise exception 'Telefone inválido.';end if;
 if char_length(coalesce(a->>'notes',''))>1000 then raise exception 'Observações muito longas.';end if;
 if coalesce(a->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.';end if;
 d := (a->>'date')::date;
 if extract(dow from d)=1 then raise exception 'O estúdio está fechado na segunda-feira.';end if;
 if not p_admin and (d<(now() at time zone 'America/Fortaleza')::date or d>(now() at time zone 'America/Fortaleza')::date+365) then raise exception 'Escolha uma data entre hoje e os próximos 12 meses.';end if;
 if coalesce(a->>'status','') not in('pendente','confirmado','concluido','cancelado','faltou') then raise exception 'Situação inválida.';end if;
 if category='natural' then
  if t is null or t not in('08:00','08:10','08:15','08:30','08:45','09:00','09:10','09:15','09:30','09:35','09:40') then raise exception 'Horário de chegada inválido.';end if;
 else
  if t is null or t not in('08:00','09:00','10:00','11:00','15:00','16:00','17:00','18:00','19:00') then raise exception 'Horário inválido.';end if;
  if melanina_private.minute(t)+(a->>'duration')::int>1200 then raise exception 'O atendimento ultrapassa o fechamento às 20h.';end if;
 end if;
end;
$$;
create function melanina_private.assert_available(a jsonb) returns void language plpgsql set search_path='' as $$
begin
 if exists(select 1 from public.appointments r where r.id<>(a->>'id')::uuid and melanina_private.overlap(a,r.data)) or
 exists(select 1 from public.blocks b where melanina_private.blocked(a,b.data)) then raise exception 'conflito: horário ocupado ou bloqueado.';end if;
end;
$$;

create function public.unavailable_times(p_date text,p_service text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb; slots text[]; t text; a jsonb; result jsonb := '[]'; d date;
begin
 if coalesce(p_date,'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.';end if;
 d := p_date::date;
 select data into s from public.services where id=p_service and (data->>'active')::boolean;
 if s is null then raise exception 'Serviço indisponível.';end if;
 slots := case when s->>'category'='natural' then array['08:00','08:10','08:15','08:30','08:45','09:00','09:10','09:15','09:30','09:35','09:40'] else array['08:00','09:00','10:00','11:00','15:00','16:00','17:00','18:00','19:00'] end;
 foreach t in array slots loop
  a:=jsonb_build_object('date',p_date,'time',t,'category',s->>'category','duration',(s->>'duration')::int,'status','pendente');
  if extract(dow from d)=1 or d<(now() at time zone 'America/Fortaleza')::date or d>(now() at time zone 'America/Fortaleza')::date+365 or
  (s->>'category'<>'natural' and melanina_private.minute(t)+(s->>'duration')::int>1200) or
  exists(select 1 from public.appointments r where melanina_private.overlap(a,r.data)) or exists(select 1 from public.blocks b where melanina_private.blocked(a,b.data)) then
   result:=result||to_jsonb(t);
  end if;
 end loop;
 return result;
end;
$$;

create function public.create_booking(p_input jsonb,p_admin boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare s jsonb; a jsonb; id uuid:=gen_random_uuid(); extra_price numeric:=0; extras jsonb; total numeric; extra_count int;
begin
 p_admin:=coalesce(p_admin,false);
 -- One transaction lock protects all reservation, reschedule and block operations.
 perform pg_advisory_xact_lock(761954201);
 if p_admin and not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.';end if;
 select data into s from public.services where public.services.id=p_input->>'serviceId' and (data->>'active')::boolean;
 if s is null then raise exception 'Serviço indisponível.';end if;
 extras:=coalesce(p_input->'addons','[]');
 if jsonb_typeof(extras)<>'array' or jsonb_array_length(extras)>5 then raise exception 'Adicionais inválidos.';end if;
 select coalesce(sum((data->>'price')::numeric),0),count(*) into extra_price,extra_count from public.addons where public.addons.id in(select jsonb_array_elements_text(extras));
 if extra_count<>jsonb_array_length(extras) then raise exception 'Adicionais inválidos ou duplicados.';end if;
 total:=(s->>'price')::numeric+extra_price;
 a:=jsonb_build_object('id',id,'name',trim(coalesce(p_input->>'name','')),'phone',regexp_replace(coalesce(p_input->>'phone',''),'\D','','g'),
 'serviceId',s->>'id','serviceName',s->>'name','date',p_input->>'date','time',p_input->>'time','duration',(s->>'duration')::int,
 'category',s->>'category','amount',total,'status','pendente','notes',coalesce(p_input->>'notes',''),'addons',extras,'payments','[]'::jsonb,
 'history',jsonb_build_array(jsonb_build_object('at',now(),'message',case when p_admin then 'Criado no painel' else 'Solicitado pelo site' end)),'createdAt',now());
 perform melanina_private.validate_booking(a,p_admin);
 if not p_admin then
  if a->>'phone'='' then raise exception 'Informe telefone com DDD.';end if;
  if (select count(*) from public.appointments where data->>'phone'=a->>'phone' and (data->>'createdAt')::timestamptz>now()-interval '1 day')>=5 then raise exception 'Limite diário de solicitações atingido. Entre em contato com o estúdio.';end if;
 end if;
 perform melanina_private.assert_available(a);
 insert into public.appointments values(id,a);
 return id;
end;
$$;

create function public.update_booking(p_id uuid,p_patch jsonb) returns void language plpgsql security definer set search_path='' as $$
declare a jsonb;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.';end if;
 perform pg_advisory_xact_lock(761954201);
 select data into a from public.appointments where id=p_id for update;
 if a is null then raise exception 'Agendamento não encontrado.';end if;
 -- Only editable fields can change; prices, payments, duration and service remain historical.
 a:=a||jsonb_build_object('name',trim(coalesce(p_patch->>'name',a->>'name')),'phone',regexp_replace(coalesce(p_patch->>'phone',a->>'phone'),'\D','','g'),
 'date',coalesce(p_patch->>'date',a->>'date'),'time',coalesce(p_patch->>'time',a->>'time'),'status',coalesce(p_patch->>'status',a->>'status'),'notes',coalesce(p_patch->>'notes',a->>'notes'));
 perform melanina_private.validate_booking(a,true);
 perform melanina_private.assert_available(a);
 a:=jsonb_set(a,'{history}',a->'history'||jsonb_build_array(jsonb_build_object('at',now(),'message','Atualizado: '||(a->>'status')||' • '||(a->>'date')||' • '||(a->>'time'))));
 update public.appointments set data=a where id=p_id;
end;
$$;
create function public.record_payment(p_id uuid,p_amount numeric,p_date text,p_method text) returns void language plpgsql security definer set search_path='' as $$
declare a jsonb; received numeric; d date;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.';end if;
 perform pg_advisory_xact_lock(761954201);
 select data into a from public.appointments where id=p_id for update;
 if a is null then raise exception 'Agendamento não encontrado.';end if;
 if a->>'status' in('cancelado','faltou') then raise exception 'Não é possível receber em agendamento cancelado ou com falta.';end if;
 select coalesce(sum((p->>'amount')::numeric),0) into received from jsonb_array_elements(a->'payments') p;
 if p_amount is null or p_amount::text in('NaN','Infinity','-Infinity') or p_amount<=0 or p_amount<>round(p_amount,2) or received+p_amount>(a->>'amount')::numeric then raise exception 'Valor inválido ou maior que o saldo.';end if;
 if coalesce(p_date,'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data de recebimento inválida.';end if;
 d:=p_date::date;
 if d>(now() at time zone 'America/Fortaleza')::date then raise exception 'Data de recebimento no futuro.';end if;
 if p_method is null or p_method not in('Pix','Dinheiro','Cartão de débito','Cartão de crédito') then raise exception 'Forma de pagamento inválida.';end if;
 a:=jsonb_set(a,'{payments}',a->'payments'||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'amount',p_amount,'date',p_date,'method',p_method)));
 a:=jsonb_set(a,'{history}',a->'history'||jsonb_build_array(jsonb_build_object('at',now(),'message','Pagamento: R$ '||p_amount||' ('||p_method||')')));
 update public.appointments set data=a where id=p_id;
end;
$$;
create function public.add_block(p_date text,p_time text,p_reason text) returns uuid language plpgsql security definer set search_path='' as $$
declare b jsonb; id uuid:=gen_random_uuid(); d date;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.';end if;
 perform pg_advisory_xact_lock(761954201);
 if coalesce(p_date,'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.';end if;
 d:=p_date::date;
 if p_time is null or p_time not in('dia','Manhã (08h-11h)','Tarde (15h-19h)','08:00','08:10','08:15','08:30','08:45','09:00','09:10','09:15','09:30','09:35','09:40','10:00','11:00','15:00','16:00','17:00','18:00','19:00') then raise exception 'Horário inválido.';end if;
 if char_length(coalesce(trim(p_reason),'')) not between 1 and 200 then raise exception 'Informe um motivo (até 200 caracteres).';end if;
 b:=jsonb_build_object('id',id,'date',p_date,'time',p_time,'reason',trim(p_reason));
 if exists(select 1 from public.appointments where melanina_private.blocked(data,b)) then raise exception 'Há atendimento nesse horário. Remarque ou cancele antes de bloquear.';end if;
 insert into public.blocks values(id,b);return id;
end;
$$;
create function melanina_private.validate_catalog() returns trigger language plpgsql set search_path='' as $$
begin
 if char_length(coalesce(trim(new.data->>'name'),'')) not between 2 and 120 or new.data->>'id' is distinct from new.id then raise exception 'Nome ou identificador inválido.';end if;
 if (new.data->>'price') is null or (new.data->>'price')::numeric::text in('NaN','Infinity','-Infinity') or (new.data->>'price')::numeric<0 or (new.data->>'price')::numeric<>round((new.data->>'price')::numeric,2) then raise exception 'Preço inválido.';end if;
 if tg_table_name='services' then
  if (new.data->>'duration') is null or (new.data->>'duration')::int not between 15 and 240 or coalesce(new.data->>'category','') not in('natural','cabine','clareamento') or jsonb_typeof(new.data->'active') is distinct from 'boolean' then raise exception 'Duração ou categoria inválida.';end if;
  if tg_op='UPDATE' and new.data->>'category' is distinct from old.data->>'category' then raise exception 'Categoria não pode ser alterada.';end if;
 end if;
 return new;
end;
$$;
create trigger validate_services before insert or update on public.services for each row execute function melanina_private.validate_catalog();
create trigger validate_addons before insert or update on public.addons for each row execute function melanina_private.validate_catalog();
revoke all on all functions in schema melanina_private from public,anon,authenticated;
revoke all on function public.unavailable_times(text,text),public.create_booking(jsonb,boolean),public.update_booking(uuid,jsonb),public.record_payment(uuid,numeric,text,text),public.add_block(text,text,text) from public;
grant execute on function public.unavailable_times(text,text),public.create_booking(jsonb,boolean) to anon,authenticated;
grant execute on function public.update_booking(uuid,jsonb),public.record_payment(uuid,numeric,text,text),public.add_block(text,text,text) to authenticated;
-- Catalog seed appended below. No demo clients are inserted in the real database.

insert into public.services(id,data) values
('bronze-turbo','{"id":"bronze-turbo","name":"Bronze Turbo","price":75,"duration":180,"category":"natural","active":true,"desc":"Parafina, 2 ativadores e banho de lua clareador."}'::jsonb),
('power','{"id":"power","name":"Bronze Power","price":80,"duration":180,"category":"natural","active":true,"desc":"Giga óleo, 3 ativadores, acelerador e banho de lua clareador."}'::jsonb),
('turbinado','{"id":"turbinado","name":"Bronze Turbinado","price":85,"duration":180,"category":"natural","active":true,"desc":"Giga bronze, 3 ativadores, acelerador e intensificador."}'::jsonb),
('diamante-premium','{"id":"diamante-premium","name":"Bronze Diamante Premium","price":85,"duration":180,"category":"natural","active":true,"desc":"Ativador diamante premium e banho de lua clareador."}'::jsonb),
('solazul','{"id":"solazul","name":"Bronze Sol Azul","price":120,"duration":45,"category":"cabine","active":true,"desc":"Ativador, intensificador, fixador, acelerador e banho de lua."}'::jsonb),
('solazul-turbo','{"id":"solazul-turbo","name":"Bronze Sol Azul Turbo","price":130,"duration":45,"category":"cabine","active":true,"desc":"3 ativadores, intensificador, fixador, acelerador e banho de lua."}'::jsonb),
('duplo','{"id":"duplo","name":"Bronze Duplo","price":145,"duration":120,"category":"cabine","active":true,"desc":"Bronze artificial turbo + bronze natural no sol."}'::jsonb),
('clareamento-corporal','{"id":"clareamento-corporal","name":"Clareamento Corporal","price":40,"duration":30,"category":"clareamento","active":true,"desc":"Clareamento de 4 áreas do corpo e rosto."}'::jsonb),
('banho-lua-clareador','{"id":"banho-lua-clareador","name":"Banho de Lua Clareador","price":75,"duration":45,"category":"clareamento","active":true,"desc":"Banho de lua com ação clareadora."}'::jsonb);
insert into public.addons(id,data) values
('clareamento-area','{"id":"clareamento-area","name":"Clareamento de Área","price":10}'::jsonb),
('argiloterapia-facial','{"id":"argiloterapia-facial","name":"Argiloterapia Facial","price":10}'::jsonb),
('tatuagem-temporaria','{"id":"tatuagem-temporaria","name":"Tatuagem Temporária","price":5}'::jsonb),
('tattoo-solar','{"id":"tattoo-solar","name":"Tattoo Solar","price":5}'::jsonb),
('intensificacao-alcinha','{"id":"intensificacao-alcinha","name":"Intensificação de Alcinha","price":15}'::jsonb);
commit;
