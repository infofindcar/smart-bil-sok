// scripts/generate-sitemap.js
//
// Hämtar alla aktiva bil-ID:n från Supabase (via edge function) och genererar public/sitemap.xml.
//
// Kör manuellt:
//   SYNC_SECRET=... node scripts/generate-sitemap.js
//
// Kör automatiskt via GitHub Actions: .github/workflows/update-sitemap.yml

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const FUNCTION_URL =
  process.env.SUPABASE_LIST_IDS_URL ||
  'https://bvqveqoschdpenvbxygj.supabase.co/functions/v1/list-car-ids';
const SYNC_SECRET = process.env.SYNC_SECRET;
const SITE_URL = 'https://findcar.se';

async function fetchAllCarIds() {
  const res = await fetch(FUNCTION_URL, {
    method: 'GET',
    headers: {
      'x-sync-secret': SYNC_SECRET || '',
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`list-car-ids ${res.status}: ${text}`);
  }

  const { ids } = await res.json();
  return ids;
}

async function main() {
  console.log('Hämtar bil-ID:n från Supabase...');
  const ids = await fetchAllCarIds();
  console.log(`Totalt ${ids.length} aktiva bilar`);

  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
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
