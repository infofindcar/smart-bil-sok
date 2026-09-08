CREATE OR REPLACE FUNCTION public.car_review_summary(_keys text[])
RETURNS TABLE (model_normalized text, review_count bigint, avg_rating numeric)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT r.model_normalized, count(*)::bigint, round(avg(r.rating)::numeric, 1)
  FROM public.car_reviews r
  WHERE r.status = 'approved' AND r.model_normalized = ANY(_keys)
  GROUP BY r.model_normalized
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.car_reviews_guard() FROM anon, authenticated;