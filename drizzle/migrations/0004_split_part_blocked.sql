ALTER TABLE public.reservation_splits ADD COLUMN is_blocked boolean;
ALTER TABLE public.reservations ADD COLUMN first_part_blocked boolean;
CREATE OR REPLACE FUNCTION public.reset_first_part_blocked() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.check_in IS DISTINCT FROM OLD.check_in OR NEW.check_out IS DISTINCT FROM OLD.check_out THEN
    NEW.first_part_blocked := NULL;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER reservations_reset_first_part_blocked BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.reset_first_part_blocked();