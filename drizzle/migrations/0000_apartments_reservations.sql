CREATE TABLE public.apartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  name text NOT NULL DEFAULT 'My Apartment',
  airbnb_ical_url text,
  booking_ical_url text,
  cleaner_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  last_synced_at timestamptz,
  last_sync_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apartments TO authenticated;
GRANT ALL ON public.apartments TO service_role;
ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads apartment" ON public.apartments FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owner creates apartment" ON public.apartments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner updates apartment" ON public.apartments FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owner deletes apartment" ON public.apartments FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id uuid NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('airbnb','booking')),
  external_uid text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  guest_name text,
  adults integer,
  kids_ages integer[] NOT NULL DEFAULT '{}',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (apartment_id, source, external_uid)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages reservations" ON public.reservations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id AND a.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id AND a.owner_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER reservations_touch BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();