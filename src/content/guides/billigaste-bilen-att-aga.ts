import type { Guide } from './types';

export const guide: Guide = {
  slug: 'billigaste-bilen-att-aga',
  title: 'Vilken är den billigaste bilen att äga?',
  metaTitle: 'Billigaste bilen att äga — så räknar du rätt | FindCar',
  metaDescription:
    'Så hittar du den billigaste bilen att äga: alla kostnadsposter, vad som faktiskt kostar mest och hur du räknar ut din verkliga månadskostnad.',
  excerpt:
    'Den billigaste bilen är sällan den billigaste att köpa. Här är alla poster som avgör din månadskostnad — och hur du räknar ut din egen.',
  category: 'Ekonomi & ägande',
  readingMinutes: 7,
  updated: '2026-09-01',
  answer:
    'Den billigaste bilen att äga är en några år gammal, vanlig modell med låg fordonsskatt, låg försäkringspremie, billiga reservdelar och dokumenterad service — som du köper när den redan tappat merparten av sitt värde men innan de dyra slitdelarna behöver bytas. För de flesta betyder det en välskött bensin-, hybrid- eller elbil i kompaktklassen, inte den billigaste bilen i annonslistan. Värdeminskningen är den största kostnadsposten på nyare bilar och den minsta på äldre.',
  blocks: [
    {
      type: 'p',
      text: 'De flesta jämför bilar på annonspris. Men annonspriset är bara en av sex kostnader, och sällan den som avgör vad bilen kostar dig per månad.',
    },
    { type: 'h2', text: 'Vilka kostnader ingår i att äga en bil?' },
    {
      type: 'table',
      headers: ['Kostnadspost', 'Vad den styrs av', 'Hur du sänker den'],
      rows: [
        [
          'Värdeminskning',
          'Bilens ålder, modell och efterfrågan',
          'Köp en bil som redan tappat sin snabbaste värdeminskning — ofta 3–6 år gammal',
        ],
        [
          'Drivmedel eller el',
          'Förbrukning och din körsträcka',
          'Matcha drivmedel mot din körprofil; ladda hemma om du kör el',
        ],
        [
          'Försäkring',
          'Modell, motorstyrka, din ålder och bostadsort',
          'Begär offert före köp och jämför mellan modeller — skillnaden kan bli tusenlappar per år',
        ],
        [
          'Fordonsskatt',
          'Utsläpp och drivmedel',
          'Kontrollera skatten för det specifika exemplaret innan köp',
        ],
        [
          'Service och slitdelar',
          'Modell, ålder och hur bilen skötts',
          'Välj vanliga modeller med billiga delar och komplett servicehistorik',
        ],
        [
          'Räntekostnad',
          'Lånebelopp och ränta',
          'Större kontantinsats eller kortare löptid ger lägre total räntekostnad',
        ],
      ],
    },
    { type: 'h2', text: 'Vilken ålder är billigast att äga?' },
    {
      type: 'p',
      text: 'Kostnadskurvan har två ändar. En helt ny bil har låga reparationskostnader men hög värdeminskning. En mycket gammal bil har nästan ingen värdeminskning men hög risk för dyra reparationer. Billigast per månad ligger normalt någonstans i mitten: en bil som är några år gammal, har garantirester eller dokumenterad service och där de stora slitdelarna nyligen bytts.',
    },
    {
      type: 'p',
      text: 'Det viktigaste undantaget är om du kan reparera själv eller har en pålitlig verkstad. Då kan en äldre, enkel bil vara den billigaste lösningen som finns.',
    },
    {
      type: 'search',
      label: 'Se bilar med låg total månadskostnad',
      query: 'Jag vill hitta en bil som är så billig som möjligt att äga per månad, inte bara billig att köpa',
    },
    { type: 'h2', text: 'Vilket drivmedel är billigast?' },
    {
      type: 'ul',
      items: [
        '**El** — lägst kostnad per mil om du laddar hemma, minst service. Men högre försäkringspremie är vanligt och värdeminskningen har varit snabb.',
        '**Bensin** — lägst inköpspris och enklast teknik. Bäst vid låg körsträcka.',
        '**Diesel** — lägst förbrukning på långkörning. Blir bara billigt om du kör mycket och långt.',
        '**Hybrid** — sänker förbrukningen i stadstrafik utan att kräva laddning.',
        '**Laddhybrid** — billig bara om du laddar dagligen; annars dyrare än en vanlig bensinbil.',
      ],
    },
    { type: 'h2', text: 'Hur räknar jag ut min egen månadskostnad?' },
    {
      type: 'ol',
      items: [
        'Uppskatta värdeminskningen: gissa vad bilen är värd om tre år, dra av från priset och dela med 36.',
        'Räkna drivmedel: årlig körsträcka × förbrukning × pris, delat med 12.',
        'Lägg till försäkringspremien enligt offert, delat med 12.',
        'Lägg till fordonsskatten, delat med 12.',
        'Lägg till en schablon för service och slitdelar — på en äldre bil bör den vara generös.',
        'Lägg till räntekostnaden om du lånar.',
      ],
    },
    {
      type: 'p',
      text: 'Summan är din verkliga månadskostnad. Gör samma räkning för två eller tre bilar och du ser snabbt att den som ser billigast ut i annonsen ofta hamnar sist.',
    },
    {
      type: 'p',
      text: 'På varje bilsida hos oss visas en uppskattad månadskostnad, där löpande utgifter redovisas separat från värdeminskning och bundet kapital — så att du ser vad du faktiskt betalar varje månad och vad som är en beräknad värdeförändring.',
    },
    {
      type: 'search',
      label: 'Jämför två bilar på totalkostnad',
      query: 'Jämför totalkostnaden per månad mellan en bensinbil och en elbil i samma prisklass',
    },
  ],
  faq: [
    {
      question: 'Är en dyrare bil alltid dyrare att äga?',
      answer:
        'Nej. En dyrare bil med låg skatt, låg förbrukning, billig försäkring och nyligen utförd service kan bli billigare per månad än en billig bil med hög skatt och okänd historik.',
    },
    {
      question: 'Hur mycket bör jag räkna för oväntade reparationer?',
      answer:
        'Sätt en fast månatlig buffert och höj den med bilens ålder och körsträcka. Bättre att överskatta än att tvingas låna vid ett haveri.',
    },
    {
      question: 'Sänker låg körsträcka alla kostnader?',
      answer:
        'Den sänker drivmedel och slitage, men inte skatt, försäkring eller värdeminskning över tid. Bilar som står stilla kan också få problem med batteri, bromsar och tätningar.',
    },
    {
      question: 'Är det billigare att leasa än att äga?',
      answer:
        'Leasing ger förutsägbara kostnader men innebär oftast högre total kostnad över tid, eftersom du betalar för de dyraste åren av bilens värdeminskning.',
    },
  ],
  related: ['bilens-vardeminskning-vad-paverkar', 'leasing-vs-kopa-begagnad-bil', 'finansiera-bilkop-kontant-lan-leasing'],
};
