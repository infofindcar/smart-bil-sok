-- Säkerhetsfix för Supabase advisor-varning på active_cars-vyn.
--
-- Problem: vyn skapades utan security_invoker, vilket gör att den körs med
-- skaparens permissions (postgres = superuser). Det kringgår RLS på
-- underliggande tabeller, vilket är onödigt eftersom Lovable/car_models/
-- car_makes redan har publika läs-policies.
--
-- Fix: aktivera security_invoker så vyn respekterar RLS på den frågande
-- användaren. Eftersom RLS redan tillåter publik läsning blir resultatet
-- identiskt — bara via rätt säkerhetsmodell.
--
-- Skapades live via MCP apply_migration 2026-04-24.

ALTER VIEW public.active_cars SET (security_invoker = true);
