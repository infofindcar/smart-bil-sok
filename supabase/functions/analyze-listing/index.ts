import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIRECRAWL_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');

const RATE_LIMIT = 3; // per day per IP
const CACHE_HOURS = 24;

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function normalizeUrl(u: string): string {
  try {
    const parsed = new URL(u.trim());
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return u.trim();
  }
}

type Listing = {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  mileage_km?: number | null;
  price_sek?: number | null;
  fuel?: string | null;
  gearbox?: string | null;
  seller_type?: string | null;
  image_count?: number | null;
  description_length?: number | null;
  title?: string | null;
};

async function scrapeListing(url: string): Promise<{ listing: Listing; markdown: string } | null> {
  if (!FIRECRAWL_KEY) throw new Error('Firecrawl not configured');

  const resp = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FIRECRAWL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      onlyMainContent: true,
      formats: [
        'markdown',
        {
          type: 'json',
          prompt:
            'Extract from this Swedish car listing: make, model, year (4-digit), mileage_km (kilometers as number), price_sek (price in SEK as number), fuel (Bensin/Diesel/El/Hybrid), gearbox (Manuell/Automat), seller_type (Företag/Privat), image_count (number of photos in the ad), description_length (length of the description in characters), title (the ad headline).',
          schema: {
            type: 'object',
            properties: {
              make: { type: 'string' },
              model: { type: 'string' },
              year: { type: 'number' },
              mileage_km: { type: 'number' },
              price_sek: { type: 'number' },
              fuel: { type: 'string' },
              gearbox: { type: 'string' },
              seller_type: { type: 'string' },
              image_count: { type: 'number' },
              description_length: { type: 'number' },
              title: { type: 'string' },
            },
          },
        },
      ],
    }),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    console.error('Firecrawl error', resp.status, txt);
    return null;
  }
  const data = await resp.json();
  const doc = data?.data ?? data;
  const listing: Listing = doc?.json ?? {};
  const markdown: string = doc?.markdown ?? '';
  return { listing, markdown };
}

async function fetchMarketComparison(
  supabase: ReturnType<typeof createClient>,
  listing: Listing,
): Promise<{ count: number; avg_price: number | null; avg_mileage: number | null } | null> {
  if (!listing.make || !listing.model || !listing.year) return null;
  const yearMin = listing.year - 1;
  const yearMax = listing.year + 1;

  let q = supabase
    .from('Lovable')
    .select('price, mileage')
    .ilike('make', listing.make)
    .ilike('model', `%${listing.model}%`)
    .gte('year', yearMin)
    .lte('year', yearMax)
    .not('price', 'is', null);

  if (listing.mileage_km && listing.mileage_km > 0) {
    q = q.gte('mileage', Math.max(0, listing.mileage_km - 30000)).lte('mileage', listing.mileage_km + 30000);
  }

  const { data, error } = await q.limit(200);
  if (error || !data || data.length === 0) return null;

  const prices = data.map((r: any) => Number(r.price)).filter((n: number) => n > 1000);
  const mileages = data.map((r: any) => Number(r.mileage)).filter((n: number) => n > 0);
  if (prices.length === 0) return null;

  return {
    count: prices.length,
    avg_price: Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length),
    avg_mileage: mileages.length ? Math.round(mileages.reduce((a: number, b: number) => a + b, 0) / mileages.length) : null,
  };
}

async function fetchModelReputation(
  supabase: ReturnType<typeof createClient>,
  make?: string | null,
  model?: string | null,
): Promise<any | null> {
  if (!make || !model) return null;
  const { data } = await supabase
    .from('car_models')
    .select('*')
    .ilike('make', make)
    .ilike('model', model)
    .maybeSingle();
  return data ?? null;
}

type AnalysisResult = {
  pris: { status: 'bra' | 'ok' | 'varning'; text: string };
  rykte: { status: 'bra' | 'ok' | 'varning'; text: string };
  annonskvalitet: { status: 'bra' | 'ok' | 'varning'; text: string };
  agandekostnad: { status: 'bra' | 'ok' | 'varning'; text: string };
  summering: string;
  score: number;
  score_label: string;
  liknande_modeller: string[];
  bil?: {
    make?: string;
    model?: string;
    year?: number;
    mileage_km?: number;
    price_sek?: number;
  };
};

async function runAnalysis(
  listing: Listing,
  markdown: string,
  market: { count: number; avg_price: number | null; avg_mileage: number | null } | null,
  reputation: any,
): Promise<AnalysisResult> {
  if (!LOVABLE_KEY) throw new Error('LOVABLE_API_KEY missing');

  const systemPrompt = `Du är en svensk bilexpert som hjälper privatpersoner bedöma begagnade bilannonser. Du svarar ALLTID på svenska och är konkret, ärlig och kort. Aldrig fluff. Använd "du"-tilltal.

Bedöm fyra dimensioner. För varje sätt status:
- "bra" = positivt / inga varningar
- "ok" = acceptabelt men med en reservation
- "varning" = något användaren verkligen bör kolla

Håll varje "text" till max 1-2 korta meningar.`;

  const userPrompt = `ANNONSEN:
${JSON.stringify(listing, null, 2)}

MARKNADSDATA (jämförbara bilar i vår databas):
${market ? JSON.stringify(market) : 'Ingen jämförelse hittades.'}

MODELLENS RYKTE (vår berikade data):
${reputation ? JSON.stringify({
  body_type: reputation.body_type,
  drivetrain_default: reputation.drivetrain_default,
  typical_issues: reputation.typical_issues,
  notes: reputation.notes,
}) : 'Ingen modelldata cachad.'}

ANNONSTEXT (utdrag):
${markdown.slice(0, 4000)}

Bedöm:
1. pris: jämför annonsens pris mot marknadsdata. Om ingen marknadsdata, säg det ärligt.
2. rykte: kända svagheter för just denna modell/årgång (kamkedja, växellåda, rost, elektronik).
3. annonskvalitet: bildantal, beskrivningens längd, säljartyp, varningstecken ("pris på förfrågan", otydlig historik, leasingrest).
4. agandekostnad: grov uppskattning kr/år för skatt + försäkring + service baserat på bilen.

summering: en mening som sammanfattar — köpvärd, värd att kolla närmare, eller skippa.

score: ETT samlat betyg 0.0–10.0 (en decimal) som väger ihop pris, rykte, annonskvalitet och ägandekostnad. 8.0+ = riktigt bra, 6.0–7.9 = okej, under 6.0 = tveksam.
score_label: kort etikett ("Riktigt bra köp", "Värd att kolla", "Tveksam" osv).
liknande_modeller: 4 konkurrenter i samma klass/segment (t.ex. BMW 5-serie → ["Mercedes E-Klass","Audi A6","Volvo S90","Jaguar XF"]). Svenska sök-namn, bara märke+modell utan årtal.`;

  const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'listing_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              pris: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  status: { type: 'string', enum: ['bra', 'ok', 'varning'] },
                  text: { type: 'string' },
                },
                required: ['status', 'text'],
              },
              rykte: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  status: { type: 'string', enum: ['bra', 'ok', 'varning'] },
                  text: { type: 'string' },
                },
                required: ['status', 'text'],
              },
              annonskvalitet: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  status: { type: 'string', enum: ['bra', 'ok', 'varning'] },
                  text: { type: 'string' },
                },
                required: ['status', 'text'],
              },
              agandekostnad: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  status: { type: 'string', enum: ['bra', 'ok', 'varning'] },
                  text: { type: 'string' },
                },
                required: ['status', 'text'],
              },
              summering: { type: 'string' },
              score: { type: 'number' },
              score_label: { type: 'string' },
              liknande_modeller: { type: 'array', items: { type: 'string' } },
            },
            required: ['pris', 'rykte', 'annonskvalitet', 'agandekostnad', 'summering', 'score', 'score_label', 'liknande_modeller'],
          },
        },
      },
    }),
  });

  if (resp.status === 429) throw new Error('rate_limit_ai');
  if (resp.status === 402) throw new Error('credits_exhausted');
  if (!resp.ok) {
    const txt = await resp.text();
    console.error('AI error', resp.status, txt);
    throw new Error('ai_failed');
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as AnalysisResult;
  parsed.bil = {
    make: listing.make ?? undefined,
    model: listing.model ?? undefined,
    year: listing.year ?? undefined,
    mileage_km: listing.mileage_km ?? undefined,
    price_sek: listing.price_sek ?? undefined,
  };
  return parsed;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = typeof body?.url === 'string' ? body.url : '';
    if (!rawUrl || rawUrl.length > 1000 || !/^https?:\/\//i.test(rawUrl)) {
      return new Response(JSON.stringify({ error: 'Ogiltig URL.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const ALLOWED_DOMAINS = [
      'blocket.se', 'www.blocket.se',
      'bytbil.com', 'www.bytbil.com',
      'bilweb.se', 'www.bilweb.se',
      'wayke.se', 'www.wayke.se',
      'kvdbil.se', 'www.kvdbil.se',
      'bilhallen.se', 'www.bilhallen.se',
      'autoscout24.se', 'www.autoscout24.se',
      'mobile.de', 'www.mobile.de',
    ];
    try {
      const parsedHostname = new URL(rawUrl).hostname.toLowerCase();
      if (!ALLOWED_DOMAINS.includes(parsedHostname)) {
        return new Response(JSON.stringify({ error: 'URL:en tillhör inte en känd bilsajt.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch {
      return new Response(JSON.stringify({ error: 'Ogiltig URL.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const url = normalizeUrl(rawUrl);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const ipHash = await sha256(getIp(req));

    // 1. Cache hit?
    const { data: cached } = await supabase
      .from('listing_analyses')
      .select('result, created_at, status')
      .eq('url', url)
      .eq('status', 'ok')
      .gte('created_at', new Date(Date.now() - CACHE_HOURS * 3600 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.result) {
      return new Response(JSON.stringify({ result: cached.result, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Rate limit
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { count } = await supabase
      .from('listing_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', since);

    if ((count ?? 0) >= RATE_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'rate_limit', message: 'Du har använt dagens gratisanalyser. Kom tillbaka imorgon.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 3. Insert pending row to count against limit even on failure
    const { data: inserted } = await supabase
      .from('listing_analyses')
      .insert({ ip_hash: ipHash, url, status: 'pending' })
      .select('id')
      .single();
    const rowId = inserted?.id;

    // 4. Scrape
    const scraped = await scrapeListing(url);
    if (!scraped || (!scraped.listing.make && !scraped.markdown)) {
      if (rowId) await supabase.from('listing_analyses').update({ status: 'error', error: 'scrape_failed' }).eq('id', rowId);
      return new Response(
        JSON.stringify({ error: 'scrape_failed', message: 'Vi kunde inte läsa annonsen. Testa en annan länk.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 5. Market + reputation
    const [market, reputation] = await Promise.all([
      fetchMarketComparison(supabase, scraped.listing),
      fetchModelReputation(supabase, scraped.listing.make, scraped.listing.model),
    ]);

    // 6. AI
    let result: AnalysisResult;
    try {
      result = await runAnalysis(scraped.listing, scraped.markdown, market, reputation);
    } catch (e) {
      const msg = (e as Error).message;
      if (rowId) await supabase.from('listing_analyses').update({ status: 'error', error: msg }).eq('id', rowId);
      if (msg === 'rate_limit_ai') {
        return new Response(JSON.stringify({ error: 'ai_busy', message: 'AI:n är upptagen just nu, försök igen om en stund.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (msg === 'credits_exhausted') {
        return new Response(JSON.stringify({ error: 'credits', message: 'Tjänsten är tillfälligt otillgänglig.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw e;
    }

    if (rowId) {
      await supabase.from('listing_analyses').update({ status: 'ok', result }).eq('id', rowId);
    }

    return new Response(JSON.stringify({ result, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('analyze-listing error', e);
    return new Response(JSON.stringify({ error: 'internal', message: 'Något gick fel. Försök igen.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});