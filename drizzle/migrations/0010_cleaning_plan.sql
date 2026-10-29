ALTER TABLE public.reservations
  ADD COLUMN cleaning_date date,
  ADD COLUMN cleaning_time text CHECK (cleaning_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE public.reservation_splits
  ADD COLUMN cleaning_date date,
  ADD COLUMN cleaning_time text CHECK (cleaning_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');