import { useEffect, useState } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { StarRating } from './StarRating';

const schema = z.object({
  make: z.string().trim().min(1, { message: 'Ange märke' }).max(60),
  model: z.string().trim().min(1, { message: 'Ange modell' }).max(80),
  year: z.number().int().min(1900).max(2100).nullable(),
  rating: z.number().int().min(1, { message: 'Sätt ett betyg' }).max(5),
  title: z.string().trim().max(100).optional(),
  body: z
    .string()
    .trim()
    .min(30, { message: 'Skriv minst 30 tecken så andra får något att gå på' })
    .max(2000, { message: 'Max 2000 tecken' }),
  ownership_months: z.number().int().min(0).max(720).nullable(),
  mileage_km: z.number().int().min(0).max(2000000).nullable(),
});

const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

export const ReviewForm = ({ onDone }: { onDone: () => void }) => {
  const [makes, setMakes] = useState<string[]>([]);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [modelSuggestions, setModelSuggestions] = useState<string[]>([]);
  const [year, setYear] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pros, setPros] = useState(['', '', '']);
  const [cons, setCons] = useState(['', '', '']);
  const [ownership, setOwnership] = useState('');
  const [mileage, setMileage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from('car_makes')
      .select('make')
      .order('make')
      .then(({ data }) => setMakes((data ?? []).map((m) => m.make)));
  }, []);

  useEffect(() => {
    if (!make.trim()) return setModelSuggestions([]);
    supabase
      .from('car_models')
      .select('model')
      .eq('make', make.trim())
      .order('model')
      .limit(200)
      .then(({ data }) => setModelSuggestions([...new Set((data ?? []).map((m) => m.model))]));
  }, [make]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      make,
      model,
      year: numOrNull(year),
      rating,
      title: title.trim() || undefined,
      body,
      ownership_months: numOrNull(ownership),
      mileage_km: numOrNull(mileage),
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? 'Kontrollera fälten');

    const cleanList = (list: string[]) =>
      list.map((s) => s.trim()).filter(Boolean).slice(0, 3).map((s) => s.slice(0, 80));

    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setBusy(false);
      return toast.error('Du behöver logga in igen.');
    }

    const { error } = await supabase.from('car_reviews').upsert(
      {
        user_id: userData.user.id,
        make: parsed.data.make,
        model: parsed.data.model,
        year: parsed.data.year,
        rating: parsed.data.rating,
        title: parsed.data.title ?? null,
        body: parsed.data.body,
        pros: cleanList(pros),
        cons: cleanList(cons),
        ownership_months: parsed.data.ownership_months,
        mileage_km: parsed.data.mileage_km,
      },
      { onConflict: 'user_id,model_normalized' }
    );
    setBusy(false);

    if (error) {
      toast.error(
        error.message.includes('duplicate')
          ? 'Du har redan skrivit om den bilen — ändra ditt tidigare inlägg i stället.'
          : 'Kunde inte spara inlägget. Kontrollera fälten och försök igen.'
      );
      return;
    }

    toast.success('Tack! Ditt inlägg granskas innan det publiceras.');
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="rf-make">Märke</Label>
          <Input id="rf-make" list="rf-makes" value={make} onChange={(e) => setMake(e.target.value)} maxLength={60} placeholder="Volvo" />
          <datalist id="rf-makes">
            {makes.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rf-model">Modell</Label>
          <Input id="rf-model" list="rf-models" value={model} onChange={(e) => setModel(e.target.value)} maxLength={80} placeholder="XC60" />
          <datalist id="rf-models">
            {modelSuggestions.map((m) => <option key={m} value={m} />)}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rf-year">Årsmodell (valfritt)</Label>
          <Input id="rf-year" inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2019" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Ditt betyg</Label>
        <StarRating value={rating} size="lg" onChange={setRating} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rf-title">Rubrik (valfritt)</Label>
        <Input id="rf-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Trygg familjebil med törst" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rf-body">Dina erfarenheter</Label>
        <Textarea
          id="rf-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={6}
          placeholder="Hur har bilen varit att äga? Verkstadsbesök, förbrukning, komfort, vad du skulle välja igen..."
        />
        <p className="text-[11px] text-muted-foreground">{body.trim().length}/2000 tecken (minst 30)</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Tre plus</Label>
          {pros.map((p, i) => (
            <Input
              key={i}
              value={p}
              maxLength={80}
              placeholder={`Plus ${i + 1}`}
              onChange={(e) => setPros(pros.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
        </div>
        <div className="space-y-2">
          <Label>Tre minus</Label>
          {cons.map((c, i) => (
            <Input
              key={i}
              value={c}
              maxLength={80}
              placeholder={`Minus ${i + 1}`}
              onChange={(e) => setCons(cons.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="rf-own">Hur länge har du ägt den? (månader)</Label>
          <Input id="rf-own" inputMode="numeric" value={ownership} onChange={(e) => setOwnership(e.target.value)} placeholder="24" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rf-mil">Miltal när du skriver</Label>
          <Input id="rf-mil" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="9500" />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={busy}>{busy ? 'Skickar...' : 'Skicka in'}</Button>
        <Button type="button" variant="outline" onClick={onDone}>Avbryt</Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Alla inlägg granskas av FindCar innan de publiceras. Bara ditt namn visas — aldrig din e-post.
      </p>
    </form>
  );
};
