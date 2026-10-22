CREATE TABLE public.reservation_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  guest_name text,
  adults integer,
  kids_ages integer[] NOT NULL DEFAULT '{}',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservation_splits TO authenticated;
GRANT ALL ON public.reservation_splits TO service_role;
ALTER TABLE public.reservation_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages splits" ON public.reservation_splits FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.reservations r JOIN public.apartments a ON a.id = r.apartment_id WHERE r.id = reservation_splits.reservation_id AND a.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.reservations r JOIN public.apartments a ON a.id = r.apartment_id WHERE r.id = reservation_splits.reservation_id AND a.owner_id = auth.uid() AND reservation_splits.start_date > r.check_in AND reservation_splits.start_date < r.check_out));

CREATE OR REPLACE FUNCTION public.clear_splits_on_date_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.check_in IS DISTINCT FROM OLD.check_in OR NEW.check_out IS DISTINCT FROM OLD.check_out THEN
    DELETE FROM public.reservation_splits WHERE reservation_id = NEW.id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reservations_clear_splits AFTER UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.clear_splits_on_date_change();