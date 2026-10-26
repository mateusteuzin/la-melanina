begin;
create table if not exists public.booking_hours(id boolean primary key default true check(id), data jsonb not null);
insert into public.booking_hours(id,data) values(true,'{"natural":["08:00","08:10","08:15","08:30","08:45","09:00","09:10","09:15","09:30","09:35","09:40"],"cabine":["08:00","09:00","10:00","11:00","15:00","16:00","17:00","18:00","19:00"],"clareamento":["08:00","09:00","10:00","11:00","15:00","16:00","17:00","18:00","19:00"]}'::jsonb) on conflict(id) do nothing;
alter table public.booking_hours enable row level security;
revoke all on public.booking_hours from anon,authenticated;

create or replace function public.get_booking_hours() returns jsonb language sql stable security definer set search_path='' as $$
 select data from public.booking_hours where id=true;
$$;
revoke all on function public.get_booking_hours() from public;
grant execute on function public.get_booking_hours() to anon,authenticated;

create or replace function public.save_booking_hours(p_hours jsonb) returns void language plpgsql security definer set search_path='' as $$
declare category text; item text; minute_value int;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.';end if;
 if jsonb_typeof(p_hours) is distinct from 'object' then raise exception 'Configuração de horários inválida.';end if;
 foreach category in array array['natural','cabine','clareamento'] loop
  if jsonb_typeof(p_hours->category) is distinct from 'array' then raise exception 'Informe uma lista de horários para cada serviço.';end if;
  if jsonb_array_length(p_hours->category)>48 then raise exception 'A lista de horários excede o limite.';end if;
  if (select count(*) from jsonb_array_elements_text(p_hours->category))<>(select count(distinct value) from jsonb_array_elements_text(p_hours->category) as x(value)) then raise exception 'Não repita horários na mesma lista.';end if;
  for item in select value from jsonb_array_elements_text(p_hours->category) as x(value) loop
   if item !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Horário inválido. Use HH:MM.';end if;
   minute_value:=split_part(item,':',1)::int*60+split_part(item,':',2)::int;
   if minute_value%5<>0 then raise exception 'Use intervalos de 5 minutos.';end if;
   if category='natural' and (minute_value<480 or minute_value>=660) then raise exception 'Bronze natural permite horários entre 08h e 11h.';end if;
   if category<>'natural' and not ((minute_value>=480 and minute_value<720) or (minute_value>=900 and minute_value<1200)) then raise exception 'Cabine e clareamento permitem horários entre 08h e 12h ou 15h e 20h.';end if;
  end loop;
 end loop;
 insert into public.booking_hours(id,data) values(true,p_hours) on conflict(id) do update set data=excluded.data;
end;
$$;
revoke all on function public.save_booking_hours(jsonb) from public;
grant execute on function public.save_booking_hours(jsonb) to authenticated;

create or replace function melanina_private.validate_booking(a jsonb,p_admin boolean) returns void language plpgsql set search_path='' as $$
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
 if not p_admin and not exists(select 1 from public.booking_hours h,jsonb_array_elements_text(h.data->category) slot where h.id and slot.value=t) then raise exception 'Este horário não está disponível para este serviço.';end if;
 if t is null or t !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Horário inválido. Use o formato HH:MM.';end if;
 if category='natural' then
  if melanina_private.minute(t)<480 or melanina_private.minute(t)>=660 or melanina_private.minute(t)%5<>0 then raise exception 'Horário de chegada inválido. Use intervalos de 5 minutos entre 08h e 11h.';end if;
 else
  if (melanina_private.minute(t)<480 or melanina_private.minute(t)>=720) and (melanina_private.minute(t)<900 or melanina_private.minute(t)>=1200) then raise exception 'Horário fora do funcionamento. Escolha entre 08h e 12h ou 15h e 20h.';end if;
  if melanina_private.minute(t)%5<>0 then raise exception 'Use intervalos de 5 minutos.';end if;
  if melanina_private.minute(t)+(a->>'duration')::int>1200 then raise exception 'O atendimento ultrapassa o fechamento às 20h.';end if;
 end if;
end;
$$;

create or replace function public.unavailable_times(p_date text,p_service text) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb; slot_config jsonb; slots text[]; t text; a jsonb; result jsonb := '[]'; d date;
begin
 if coalesce(p_date,'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.';end if;
 d := p_date::date;
 select data into s from public.services where id=p_service and (data->>'active')::boolean;
 if s is null then raise exception 'Serviço indisponível.';end if;
 select data->(s->>'category') into slot_config from public.booking_hours where id=true;
 if slot_config is null then raise exception 'Horários do estúdio não configurados.';end if;
 select array_agg(value order by value) into slots from jsonb_array_elements_text(slot_config) as x(value);
 foreach t in array coalesce(slots,array[]::text[]) loop
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
commit;

