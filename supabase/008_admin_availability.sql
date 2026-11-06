begin;

-- Admin-only availability; excludes the reservation being rescheduled.
create or replace function public.admin_available_times(p_date text,p_service text,p_exclude uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare s jsonb; original jsonb; candidate jsonb; t text; result jsonb:='[]'; d date;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.'; end if;
 if coalesce(p_date,'') !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Data inválida.'; end if;
 d:=p_date::date;
 select data into s from public.services where id=p_service;
 if s is null then raise exception 'Serviço não encontrado.'; end if;
 if p_exclude is not null then
  select data into original from public.appointments where id=p_exclude;
  if original is null or original->>'serviceId'<>p_service then raise exception 'Agendamento inválido.'; end if;
  s:=s||jsonb_build_object('category',original->>'category','duration',(original->>'duration')::int);
 elsif not (s->>'active')::boolean then raise exception 'Serviço indisponível.';
 end if;
 for t in select value from public.booking_hours h,jsonb_array_elements_text(melanina_private.day_slots(h.data,s->>'category',d)) where h.id loop
  candidate:=jsonb_build_object('id',coalesce(p_exclude,gen_random_uuid()),'serviceId',p_service,'name','Consulta de agenda','phone','','notes','','date',p_date,'time',t,'category',s->>'category','duration',(s->>'duration')::int,'status','pendente');
  begin
   perform melanina_private.validate_booking(candidate,true);
  exception when raise_exception then continue;
  end;
  if not exists(select 1 from public.appointments r where r.id is distinct from p_exclude and melanina_private.overlap(candidate,r.data)) and
     not exists(select 1 from public.blocks b where melanina_private.blocked(candidate,b.data)) then result:=result||to_jsonb(t); end if;
 end loop;
 return result;
end;
$$;
revoke all on function public.admin_available_times(text,text,uuid) from public;
grant execute on function public.admin_available_times(text,text,uuid) to authenticated;
create or replace function public.update_booking(p_id uuid,p_patch jsonb) returns void language plpgsql security definer set search_path='' as $$
declare a jsonb;
begin
 if not public.is_studio_admin() then raise exception 'Acesso administrativo necessário.';end if;
 perform pg_advisory_xact_lock(761954201);
 select data into a from public.appointments where id=p_id for update;
 if a is null then raise exception 'Agendamento não encontrado.';end if;
 -- Only editable fields can change; prices, payments, duration and service remain historical.
 a:=a||jsonb_build_object('name',trim(coalesce(p_patch->>'name',a->>'name')),'phone',regexp_replace(coalesce(p_patch->>'phone',a->>'phone'),'\D','','g'),
 'date',coalesce(p_patch->>'date',a->>'date'),'time',coalesce(p_patch->>'time',a->>'time'),'status',coalesce(p_patch->>'status',a->>'status'),'notes',coalesce(p_patch->>'notes',a->>'notes'));
 if a->>'status' not in('cancelado','faltou') then perform melanina_private.validate_booking(a,true); end if;
 perform melanina_private.assert_available(a);
 a:=jsonb_set(a,'{history}',a->'history'||jsonb_build_array(jsonb_build_object('at',now(),'message','Atualizado: '||(a->>'status')||' • '||(a->>'date')||' • '||(a->>'time'))));
 update public.appointments set data=a where id=p_id;
end;
$$;
commit;
