ALTER TABLE public.reservations ADD COLUMN feed_check_in date;
ALTER TABLE public.reservations ADD COLUMN feed_check_out date;
ALTER TABLE public.reservations ADD COLUMN smart_extension_managed boolean NOT NULL DEFAULT false;
ALTER TABLE public.reservations ADD COLUMN extension_parent_id uuid REFERENCES public.reservations(id);
CREATE INDEX reservations_extension_parent_idx ON public.reservations(extension_parent_id);

CREATE OR REPLACE FUNCTION public.apply_calendar_feed(p_apartment_id uuid, p_source text, p_url text, p_events jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public'
AS $function$
DECLARE
  v_apartment public.apartments;
  e record;
  old public.reservations;
  v_parent uuid;
  v_managed boolean;
  v_initial boolean;
  v_start date;
  v_end date;
  v_old_start date;
  v_old_end date;
  piece record;
BEGIN
  IF p_source NOT IN ('airbnb', 'booking') OR jsonb_typeof(p_events) <> 'array' THEN
    RAISE EXCEPTION 'Invalid calendar feed';
  END IF;
  SELECT * INTO v_apartment FROM public.apartments WHERE id = p_apartment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Apartment unavailable'; END IF;
  IF (CASE WHEN p_source = 'airbnb' THEN v_apartment.airbnb_ical_url ELSE v_apartment.booking_ical_url END) IS DISTINCT FROM p_url THEN
    RAISE EXCEPTION 'Calendar link changed; sync again';
  END IF;
  FOR e IN SELECT * FROM jsonb_to_recordset(p_events) AS x(external_uid text, check_in date, check_out date, is_blocked boolean, status text)
    WHERE x.external_uid NOT LIKE 'manual-%' AND x.external_uid NOT LIKE 'extension-%'
  LOOP
    SELECT * INTO old FROM public.reservations r WHERE r.apartment_id = p_apartment_id AND r.source = p_source AND r.external_uid = e.external_uid;
    v_parent := old.id;
    v_initial := old.feed_check_out IS NULL;
    v_old_start := coalesce(old.feed_check_in, old.check_in);
    v_old_end := coalesce(old.feed_check_out, old.check_out);
    v_managed := p_source = 'booking' AND old.id IS NOT NULL AND (
      old.smart_extension_managed OR old.owner_kind IS NOT NULL OR old.owner_check_in IS NOT NULL OR old.owner_check_out IS NOT NULL
      OR EXISTS (SELECT 1 FROM public.reservation_splits s WHERE s.reservation_id = old.id));
    INSERT INTO public.reservations(apartment_id, source, external_uid, check_in, check_out, is_blocked, status, feed_check_in, feed_check_out, smart_extension_managed)
    VALUES(p_apartment_id, p_source, e.external_uid, e.check_in, e.check_out, e.is_blocked, e.status, e.check_in, e.check_out, v_managed)
    ON CONFLICT(apartment_id, source, external_uid) DO UPDATE SET
      check_in = CASE WHEN v_managed THEN public.reservations.check_in ELSE EXCLUDED.check_in END,
      check_out = CASE WHEN v_managed THEN public.reservations.check_out ELSE EXCLUDED.check_out END,
      is_blocked = EXCLUDED.is_blocked, status = EXCLUDED.status,
      feed_check_in = EXCLUDED.feed_check_in, feed_check_out = EXCLUDED.feed_check_out,
      smart_extension_managed = v_managed, updated_at = now()
    RETURNING id INTO v_parent;

    -- Explicit cancellations apply to derived dates too. Shrinks retire only future missing dates.
    UPDATE public.reservations r SET status = 'cancelled', updated_at = now()
    WHERE r.extension_parent_id = v_parent AND (e.status = 'cancelled' OR
      (r.check_in > (now() AT TIME ZONE 'Europe/Warsaw')::date AND NOT r.preserve_on_feed_omission
        AND (r.check_out <= e.check_in OR r.check_in >= e.check_out)));
    UPDATE public.reservations r SET check_in = greatest(r.check_in, e.check_in), check_out = least(r.check_out, e.check_out), updated_at = now()
    WHERE r.extension_parent_id = v_parent AND e.status = 'active' AND r.status = 'active'
      AND r.check_in < e.check_out AND r.check_out > e.check_in
      AND r.owner_check_in IS NULL AND r.owner_check_out IS NULL AND r.owner_kind IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.reservation_splits s WHERE s.reservation_id = r.id)
      AND (r.check_in < e.check_in OR r.check_out > e.check_out);

    IF v_managed AND e.status = 'active' THEN
      -- Bootstrap an already-hidden tail, ending after the owner's known contiguous stays.
      IF v_initial THEN
        SELECT greatest(coalesce(old.owner_check_out, old.check_out), coalesce(max(coalesce(r.owner_check_out, r.check_out)), coalesce(old.owner_check_out, old.check_out)))
        INTO v_old_end FROM public.reservations r
        WHERE r.apartment_id = p_apartment_id AND r.status = 'active' AND r.external_uid LIKE 'manual-%'
          AND coalesce(r.owner_check_in, r.check_in) < old.check_out AND coalesce(r.owner_check_out, r.check_out) > old.check_in;
        v_old_start := e.check_in;
      END IF;
      -- Only nights newly added to the feed envelope; subtract all existing owner coverage.
      FOR piece IN
        WITH nights AS (
          SELECT d::date AS day FROM generate_series(e.check_in::timestamp, (e.check_out - 1)::timestamp, interval '1 day') d
          WHERE (d::date < v_old_start OR d::date >= v_old_end)
            AND NOT EXISTS (
              SELECT 1 FROM public.reservations r
              WHERE r.apartment_id = p_apartment_id AND r.status = 'active'
                AND (r.id = v_parent OR r.external_uid LIKE 'manual-%' OR r.owner_kind IS NOT NULL
                  OR r.owner_check_in IS NOT NULL OR r.owner_check_out IS NOT NULL OR r.extension_parent_id IS NOT NULL
                  OR EXISTS (SELECT 1 FROM public.reservation_splits s WHERE s.reservation_id = r.id))
                AND d::date >= CASE WHEN coalesce(r.owner_check_in,r.check_in) < coalesce(r.owner_check_out,r.check_out) THEN coalesce(r.owner_check_in,r.check_in) ELSE r.check_in END
                AND d::date < CASE WHEN coalesce(r.owner_check_in,r.check_in) < coalesce(r.owner_check_out,r.check_out) THEN coalesce(r.owner_check_out,r.check_out) ELSE r.check_out END
            )
        ), islands AS (SELECT day, day - (row_number() OVER (ORDER BY day))::integer AS grp FROM nights)
        SELECT min(day) AS start_date, max(day) + 1 AS end_date FROM islands GROUP BY grp
      LOOP
        INSERT INTO public.reservations(apartment_id, source, external_uid, check_in, check_out, is_blocked, status, extension_parent_id)
        VALUES(p_apartment_id, 'booking', 'extension-' || v_parent::text || '-' || piece.start_date::text || '-' || piece.end_date::text,
          piece.start_date, piece.end_date, false, 'active', v_parent)
        ON CONFLICT(apartment_id, source, external_uid) DO UPDATE SET status = 'active', updated_at = now();
      END LOOP;
    END IF;
  END LOOP;
  UPDATE public.reservations r SET status = 'cancelled', updated_at = now()
  WHERE r.apartment_id = p_apartment_id AND r.source = p_source
    AND r.external_uid NOT LIKE 'demo-%' AND r.external_uid NOT LIKE 'manual-%'
    AND NOT r.preserve_on_feed_omission AND r.check_in > (now() AT TIME ZONE 'Europe/Warsaw')::date AND r.status <> 'cancelled'
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_events) event WHERE event->>'external_uid' = r.external_uid
      OR (r.extension_parent_id IS NOT NULL AND event->>'external_uid' =
        (SELECT parent.external_uid FROM public.reservations parent WHERE parent.id = r.extension_parent_id)));
END;
$function$;
