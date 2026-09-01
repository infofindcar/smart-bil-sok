// scripts/generate-sitemap.js
//
// Hämtar alla aktiva bil-ID:n från Supabase och genererar public/sitemap.xml.
//
// Kör manuellt:
//   node scripts/generate-sitemap.js
//
// Kör automatiskt via GitHub Actions: .github/workflows/update-sitemap.yml

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://bvqveqoschdpenvbxygj.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cXZlcW9zY2hkcGVudmJ4eWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTI0MTIsImV4cCI6MjA4NTk2ODQxMn0.IkIaMMSTZE7mms3JEzN59HQ317audInFGIo5e-JcohE';
const SITE_URL = 'https://findcar.se';
const PAGE_SIZE = 1000;

async function fetchAllCarIds() {
  const ids = [];
  let offset = 0;

  while (true) {
    const url =
      `${SUPABASE_URL}/rest/v1/Lovable` +
      `?select=id&is_active=eq.true&order=id.asc&limit=${PAGE_SIZE}&offset=${offset}`;

    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'count=none',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase REST ${res.status}: ${text}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    ids.push(...data.map((r) => r.id));
    console.log(`  Sida ${Math.floor(offset / PAGE_SIZE) + 1}: ${data.length} bilar (totalt ${ids.length})`);

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return ids;
}

async function main() {
  console.log('Genererar sitemap.xml...');

  const ids = await fetchAllCarIds();
  console.log(`Totalt ${ids.length} aktiva bilar hittade`);

  const today = new Date().toISOString().split('T')[0];

  // Guide-slugs speglar src/content/guides/index.ts. Uppdatera båda när en guide läggs till.
  const guideSlugs = [
    'prisvard-begagnad-bil',
    'checklista-innan-bilkop',
    'elbil-eller-bensinbil-begagnad',
    'leasing-vs-kopa-begagnad-bil',
    'bilens-vardeminskning-vad-paverkar',
    'finansiera-bilkop-kontant-lan-leasing',
    'vanliga-fallgropar-privatkop-bil',
    'besiktningsprotokoll-vad-betyder-det',
    'basta-begagnade-elbilen',
    'basta-begagnade-suv',
    'basta-laddhybriden-begagnad',
    'basta-smabilen-begagnad',
    'vilken-bil-ska-jag-kopa',
    'billigaste-bilen-att-aga',
    'volvo-xc60-begagnad-kop-guide',
    'tesla-model-3-begagnad',
    'volkswagen-golf-begagnad-kop-guide',
    'volvo-v60-begagnad-kop-guide',
    'bmw-3-serie-begagnad-kop-guide',
  ];

  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE_URL}/guider`, changefreq: 'monthly', priority: '0.8' },
    ...guideSlugs.map((slug) => ({
      loc: `${SITE_URL}/guider/${slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    })),
    { loc: `${SITE_URL}/om-oss`, changefreq: 'monthly', priority: '0.6' },
    { loc: `${SITE_URL}/compare`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.3' },
    { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.3' },
  ];

  const urlToXml = ({ loc, changefreq, priority, lastmod }) =>
    `  <url>\n    <loc>${loc}</loc>\n${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls.map(urlToXml),
    ...ids.map((id) =>
      urlToXml({
        loc: `${SITE_URL}/car/${id}`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '0.6',
      })
    ),
    '</urlset>',
  ].join('\n');

  const outPath = join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');
  console.log(`Klar: ${staticUrls.length + ids.length} URL:er → public/sitemap.xml`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
