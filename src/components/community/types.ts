export type CarReview = {
  id: string;
  user_id: string;
  make: string;
  model: string;
  model_normalized: string;
  year: number | null;
  rating: number;
  title: string | null;
  body: string;
  pros: string[];
  cons: string[];
  ownership_months: number | null;
  mileage_km: number | null;
  status: string;
  created_at: string;
  /** Fylls i från profiles-tabellen. */
  author?: string | null;
};
