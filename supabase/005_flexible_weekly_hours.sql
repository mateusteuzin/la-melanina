begin;
update public.booking_hours set data=data || '{"cabine":["14:30","15:30","16:30","17:30","18:30","19:30","20:30"],"cabineSaturday":["14:00","15:00","16:00","17:00"],"cabineSunday":["08:00","09:00","10:00","11:00"],"openDays":[0,2,3,4,5,6]}'::jsonb where id;

create or replace function melanina_private.day_slots(config jsonb,category text,d date)
returns jsonb language sql immutable set search_path='' as $$
 select case when category='cabine' and extract(dow from d)=6 then config->'cabineSaturday'
 when category='cabine' and extract(dow from d)=0 then config->'cabineSunday' else config->category end;
$$;
create or replace function public.save_booking_hours(p_hours jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare category text; item text; minute_value int;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.'; end if;
 if not (p_hours ? 'openDays') or jsonb_typeof(p_hours->'openDays') is distinct from 'array' then raise exception 'Informe os dias de funcionamento.'; end if;
 if exists(select 1 from jsonb_array_elements(p_hours->'openDays') d where d::text !~ '^[0-6]$') then raise exception 'Dia da semana invalido.'; end if;
 if jsonb_typeof(p_hours) is distinct from 'object' then raise exception 'Configuração de horários inválida.'; end if;
 foreach category in array array['natural','cabine','clareamento','cabineSaturday','cabineSunday'] loop
  if jsonb_typeof(p_hours->category) is distinct from 'array' then raise exception 'Informe uma lista de horários para cada serviço.'; end if;
  if jsonb_array_length(p_hours->category)>48 then raise exception 'A lista de horários excede o limite.'; end if;
  if category='natural' and jsonb_array_length(p_hours->category)<>12 then raise exception 'Bronze natural precisa manter 12 vagas.'; end if;
  if (select count(*) from jsonb_array_elements_text(p_hours->category))<>(select count(distinct value) from jsonb_array_elements_text(p_hours->category) as x(value)) then raise exception 'Não repita horários na mesma lista.'; end if;
  for item in select value from jsonb_array_elements_text(p_hours->category) as x(value) loop
   if category='natural' then
    if item !~ '^Vaga (1[0-2]|[1-9])$' then raise exception 'Bronze natural usa as vagas 1 a 12.'; end if;
   else
    if item !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Horário inválido. Use HH:MM.'; end if;
    minute_value:=split_part(item,':',1)::int*60+split_part(item,':',2)::int;
    if minute_value%5<>0 or not (minute_value>=480 and minute_value<=1230) then raise exception 'Horário fora do funcionamento.'; end if;
   end if;
  end loop;
 end loop;
 insert into public.booking_hours(id,data) values(true,p_hours) on conflict(id) do update set data=excluded.data;
end;
$$;
revoke all on function public.save_booking_hours(jsonb) from public;
grant execute on function public.save_booking_hours(jsonb) to authenticated;

create or replace function melanina_private.validate_booking(a jsonb,p_admin boolean)
returns void language plpgsql set search_path='' as $$
declare d date; t text := a->>'time'; category text := a->>'category';
begin
 if char_length(coalesce(trim(a->>'name'),'')) not between 2 and 120 then raise exception 'Informe um nome válido.'; end if;
 if coalesce(a->>'phone','')<>'' and a->>'phone' !~ '^\d{10,13}$' then raise exception 'Telefone inválido.'; end if;
 if char_length(coalesce(a->>'notes',''))>1000 then raise exception 'Observações muito longas.'; end if;
 if coalesce(a->>'date','') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.'; end if;
 d := (a->>'date')::date;
 if not exists(select 1 from public.booking_hours h where h.id and h.data->'openDays' @> to_jsonb(array[extract(dow from d)::int])) then raise exception 'O estúdio está fechado neste dia da semana.'; end if;
 if not p_admin and (d<(now() at time zone 'America/Fortaleza')::date or d>(now() at time zone 'America/Fortaleza')::date+365) then raise exception 'Escolha uma data entre hoje e os próximos 12 meses.'; end if;
 if coalesce(a->>'status','') not in('pendente','confirmado','concluido','cancelado','faltou') then raise exception 'Situação inválida.'; end if;
 if category='natural' then
  if t is null or t !~ '^Vaga (1[0-2]|[1-9])$' then raise exception 'Escolha uma das 12 vagas do bronze natural.'; end if;
  if not p_admin and not exists(select 1 from public.booking_hours h,jsonb_array_elements_text(h.data->'natural') slot where h.id and slot.value=t) then raise exception 'Esta vaga não está disponível.'; end if;
  if not p_admin and (select count(*) from public.appointments r where r.data->>'date'=a->>'date' and r.data->>'category'='natural' and r.data->>'status' not in('cancelado','faltou'))>=12 then raise exception 'As 12 vagas de bronze natural deste dia já foram preenchidas.'; end if;
 else
  if t is null or t !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Horário inválido. Use HH:MM.'; end if;
  if not p_admin and not exists(select 1 from public.booking_hours h,jsonb_array_elements_text(melanina_private.day_slots(h.data,category,d)) slot where h.id and slot.value=t) then raise exception 'Este horário não está disponível para este serviço.'; end if;
  if (melanina_private.minute(t)<480 or melanina_private.minute(t)>1230) then raise exception 'Horário fora do funcionamento.'; end if;
  if melanina_private.minute(t)%5<>0 then raise exception 'Use intervalos de 5 minutos.'; end if;
  if melanina_private.minute(t)+(a->>'duration')::int>1440 then raise exception 'O atendimento ultrapassa o fechamento às 24h.'; end if;
 end if;
end;
$$;

create or replace function public.unavailable_times(p_date text,p_service text)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb; slots text[]; t text; a jsonb; result jsonb := '[]'; d date;
begin
 if coalesce(p_date,'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.'; end if;
 d := p_date::date;
 select data into s from public.services where id=p_service and (data->>'active')::boolean;
 if s is null then raise exception 'Serviço indisponível.'; end if;
 if s->>'category'='natural' then
  slots:=array['Vaga 1','Vaga 2','Vaga 3','Vaga 4','Vaga 5','Vaga 6','Vaga 7','Vaga 8','Vaga 9','Vaga 10','Vaga 11','Vaga 12'];
 else
  select array_agg(value order by value) into slots from public.booking_hours h,jsonb_array_elements_text(melanina_private.day_slots(h.data,s->>'category',d)) as x(value) where h.id;
 end if;
 foreach t in array coalesce(slots,array[]::text[]) loop
  a:=jsonb_build_object('date',p_date,'time',t,'category',s->>'category','duration',(s->>'duration')::int,'status','pendente');
  if not exists(select 1 from public.booking_hours h where h.id and h.data->'openDays' @> to_jsonb(array[extract(dow from d)::int])) or d<(now() at time zone 'America/Fortaleza')::date or d>(now() at time zone 'America/Fortaleza')::date+365 or
   (case when s->>'category'<>'natural' then melanina_private.minute(t)+(s->>'duration')::int>1440 else false end) or
   (s->>'category'='natural' and (select count(*) from public.appointments r where r.data->>'date'=p_date and r.data->>'category'='natural' and r.data->>'status' not in('cancelado','faltou'))>=12) or
   exists(select 1 from public.appointments r where melanina_private.overlap(a,r.data)) or
   exists(select 1 from public.blocks b where melanina_private.blocked(a,b.data)) then
   result:=result||to_jsonb(t);
  end if;
 end loop;
 return result;
end;
$$;
create or replace function public.add_block(p_date text,p_time text,p_reason text)
returns uuid language plpgsql security definer set search_path='' as $$
declare b jsonb; id uuid:=gen_random_uuid(); d date; minute_value int;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.';end if;
 perform pg_advisory_xact_lock(761954201);
 if coalesce(p_date,'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.';end if;
 d:=p_date::date;
 if p_time is null then raise exception 'Escolha o que deseja bloquear.';end if;
 if p_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
  minute_value:=melanina_private.minute(p_time);
  if minute_value%5<>0 or not (minute_value>=480 and minute_value<=1230) then raise exception 'Horário fora do funcionamento.';end if;
 elsif p_time not in('dia','Manhã (08h-11h)','Tarde (15h-19h)') and
  p_time !~ '^Vaga (1[0-2]|[1-9])$' then
  raise exception 'Escolha o dia, um período, um horário ou uma vaga do bronze natural.';
 end if;
 if char_length(coalesce(trim(p_reason),'')) not between 1 and 200 then raise exception 'Informe um motivo (até 200 caracteres).';end if;
 b:=jsonb_build_object('id',id,'date',p_date,'time',p_time,'reason',trim(p_reason));
 if exists(select 1 from public.appointments where melanina_private.blocked(data,b)) then
  raise exception 'Há atendimento nesse período. Remarque ou cancele antes de bloquear.';
 end if;
 insert into public.blocks values(id,b);return id;
end;
$$;

revoke all on function public.add_block(text,text,text) from public;
grant execute on function public.add_block(text,text,text) to authenticated;


commit;
