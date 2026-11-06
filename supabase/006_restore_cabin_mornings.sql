begin;

-- Add morning slots without removing configured hours or changing existing blocks.
update public.booking_hours h
set data = jsonb_set(jsonb_set(h.data, '{cabine}', (
 select jsonb_agg(slot order by slot) from (
  select distinct value as slot from jsonb_array_elements_text(
   coalesce(h.data->'cabine', '[]'::jsonb) || '["08:00","09:00","10:00","11:00"]'::jsonb)
 ) slots
)), '{cabineSaturday}', (
 select jsonb_agg(slot order by slot) from (
  select distinct value as slot from jsonb_array_elements_text(
   coalesce(h.data->'cabineSaturday', '["14:00","15:00","16:00","17:00"]'::jsonb) || '["08:00","09:00","10:00","11:00"]'::jsonb)
 ) slots
)) where h.id;

commit;
