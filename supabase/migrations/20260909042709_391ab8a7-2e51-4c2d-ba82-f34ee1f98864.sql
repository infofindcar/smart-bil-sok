ALTER TABLE public.leads DROP CONSTRAINT leads_car_id_fkey;
ALTER TABLE public.leads ADD CONSTRAINT leads_car_id_fkey FOREIGN KEY (car_id) REFERENCES public."Lovable"(id) ON DELETE SET NULL;