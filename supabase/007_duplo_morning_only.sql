begin;

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
  if a->>'serviceId'='duplo' and melanina_private.minute(t)>=720 then raise exception 'Bronze Duplo só pode ser agendado pela manhã.'; end if;
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
   (p_service='duplo' and melanina_private.minute(t)>=720) or
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

update public.services set data=jsonb_set(data,'{desc}',to_jsonb('Bronze artificial turbo + bronze natural no sol. Agendamento somente pela manhã.'::text)) where id='duplo';

commit;
