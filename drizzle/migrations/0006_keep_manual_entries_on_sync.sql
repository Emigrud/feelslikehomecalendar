CREATE OR REPLACE FUNCTION public.apply_calendar_feed(p_apartment_id uuid, p_source text, p_url text, p_events jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_apartment public.apartments;
BEGIN
  IF p_source NOT IN ('airbnb', 'booking') OR jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION 'Invalid calendar feed';
  END IF;
  SELECT * INTO v_apartment FROM public.apartments WHERE id = p_apartment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Apartment unavailable'; END IF;
  IF (CASE WHEN p_source = 'airbnb' THEN v_apartment.airbnb_ical_url ELSE v_apartment.booking_ical_url END) IS DISTINCT FROM p_url THEN
    RAISE EXCEPTION 'Calendar link changed; sync again';
  END IF;
  INSERT INTO public.reservations (apartment_id, source, external_uid, check_in, check_out, is_blocked, status)
  SELECT p_apartment_id, p_source, e.external_uid, e.check_in, e.check_out, e.is_blocked, e.status
  FROM jsonb_to_recordset(p_events) AS e(external_uid text, check_in date, check_out date, is_blocked boolean, status text)
  WHERE e.external_uid NOT LIKE 'manual-%'
  ON CONFLICT (apartment_id, source, external_uid) DO UPDATE SET
    check_in = EXCLUDED.check_in, check_out = EXCLUDED.check_out,
    is_blocked = EXCLUDED.is_blocked, status = EXCLUDED.status, updated_at = now();
  UPDATE public.reservations r SET status = 'cancelled', updated_at = now()
  WHERE r.apartment_id = p_apartment_id AND r.source = p_source
    AND r.external_uid NOT LIKE 'demo-%' AND r.external_uid NOT LIKE 'manual-%'
    AND r.status <> 'cancelled'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_events) e WHERE e->>'external_uid' = r.external_uid);
END;
$function$;