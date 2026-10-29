begin;

create or replace function melanina_private.blocked(a jsonb,b jsonb)
returns boolean language sql immutable set search_path='' as $$
 select a->>'status' not in('cancelado','faltou') and a->>'date'=b->>'date' and
 (b->>'time'='dia' or a->>'time'=b->>'time' or
  (a->>'category'<>'natural' and
   ((b->>'time'='Manhã (08h-11h)' and melanina_private.minute(a->>'time')<720 and
     480<melanina_private.minute(a->>'time')+(a->>'duration')::int) or
    (b->>'time'='Tarde (15h-19h)' and melanina_private.minute(a->>'time')<1200 and
     900<melanina_private.minute(a->>'time')+(a->>'duration')::int) or
    (b->>'time' ~ '^\d{2}:\d{2}$' and
     melanina_private.minute(a->>'time')<melanina_private.minute(b->>'time')+60 and
     melanina_private.minute(b->>'time')<melanina_private.minute(a->>'time')+(a->>'duration')::int))));
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
  if minute_value%5<>0 or not ((minute_value>=480 and minute_value<720) or
    (minute_value>=900 and minute_value<1200)) then raise exception 'Horário fora do funcionamento.';end if;
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
