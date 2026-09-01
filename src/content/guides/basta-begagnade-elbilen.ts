import type { Guide } from './types';

export const guide: Guide = {
  slug: 'basta-begagnade-elbilen',
  title: 'Vilken är den bästa begagnade elbilen?',
  metaTitle: 'Bästa begagnade elbilen — så väljer du rätt | FindCar',
  metaDescription:
    'Så väljer du bästa begagnade elbilen: räckvidd på vintern, batterihälsa, laddhastighet, garanti och vilka modeller som passar olika behov och budgetar.',
  excerpt:
    'Det finns ingen enda "bästa" elbil — men det finns en bästa elbil för din körprofil. Så matchar du räckvidd, laddning och pris mot hur du faktiskt kör.',
  category: 'Vilken bil ska du välja?',
  readingMinutes: 7,
  updated: '2026-09-01',
  answer:
    'Den bästa begagnade elbilen för dig är den som klarar din vanligaste veckokörning med marginal på vintern, kan snabbladdas när du reser långt, och har dokumenterad batterihälsa. För korta stadssträckor räcker en liten elbil med 25–35 kWh batteri gott. Kör du 100 km eller mer per dag, eller ofta långt, bör du sikta på minst 60 kWh batteri och en bil som snabbladdar över 100 kW. Kontrollera alltid hur mycket som återstår av batterigarantin innan du köper.',
  blocks: [
    {
      type: 'p',
      text: 'Begagnatmarknaden för elbilar har blivit bred och priserna har fallit snabbt de senaste åren. Det är bra för dig som köpare, men det gör också valet svårare — modellerna skiljer sig mer från varandra än bensinbilar gör. Den avgörande frågan är inte vilken elbil som är "bäst" i test, utan vilken som passar din körprofil.',
    },
    { type: 'h2', text: 'Vad ska du utgå från när du väljer elbil?' },
    {
      type: 'p',
      text: 'Börja med tre siffror från din egen vardag, inte från annonsen:',
    },
    {
      type: 'ol',
      items: [
        '**Din vanligaste dagssträcka.** Räkna på den längsta av dina normala dagar, inte snittet.',
        '**Din laddsituation.** Kan du ladda hemma eller på jobbet? Då räcker mindre batteri långt. Är du beroende av publik laddning väger laddhastigheten tyngre än räckvidden.',
        '**Hur ofta du kör riktigt långt.** Några gånger per år kan lösas med laddpauser. Varje vecka kräver en bil som snabbladdar snabbt och stabilt.',
      ],
    },
    {
      type: 'p',
      text: 'Räkna sedan bort ungefär 20–30 procent av den angivna räckvidden under svensk vinter, mer om du kör mycket motorväg. Det är den siffra du ska planera efter.',
    },
    { type: 'h2', text: 'Vilka elbilar passar vilka behov?' },
    {
      type: 'p',
      text: 'Tabellen är en grov segmentguide, inte en rangordning. Vilken enskild bil som är rätt beror på pris, skick och batterihälsa på just det exemplaret.',
    },
    {
      type: 'table',
      headers: ['Behov', 'Segment att titta på', 'Vad du ska kolla extra'],
      rows: [
        [
          'Andrabil, stadskörning, korta sträckor',
          'Liten elbil med mindre batteri, t.ex. Nissan Leaf, Renault Zoe, VW e-up!',
          'Batterihälsa och vinterräckvidd — marginalen är liten när batteriet är litet',
        ],
        [
          'Pendling 50–100 km per dag',
          'Kompakt elbil, t.ex. VW ID.3, Kia Niro EV, Hyundai Kona Electric',
          'Laddhastighet vid publik laddning och om värmepump finns',
        ],
        [
          'Familjebil med långresor',
          'Mellanstor elbil eller elektrisk SUV/kombi, t.ex. Tesla Model 3, Kia EV6, VW ID.4, Polestar 2',
          'Snabbladdningseffekt, dragvikt om du behöver släp, bagagevolym',
        ],
        [
          'Släpvagn, husvagn eller mycket last',
          'Större elbil med godkänd dragvikt',
          'Att dragvikten faktiskt är godkänd på just det exemplaret — och att räckvidden nästan halveras med släp',
        ],
        [
          'Lägsta möjliga månadskostnad',
          'Äldre elbil med moderat räckvidd och låg inköpspris',
          'Att batteriet inte är på väg att falla ur garantin, och kostnaden för ett eventuellt byte',
        ],
      ],
    },
    {
      type: 'search',
      label: 'Se begagnade elbilar som matchar din budget',
      query: 'Jag vill köpa en begagnad elbil. Visa alternativ med bra räckvidd och snabbladdning för pendling.',
    },
    { type: 'h2', text: 'Hur vet jag att batteriet är friskt?' },
    {
      type: 'p',
      text: 'Batteriet är elbilens dyraste komponent, så det är här du ska lägga din kontrolltid. Gör så här:',
    },
    {
      type: 'ul',
      items: [
        '**Be om en batterihälsorapport** (State of Health, SoH). Många märkesverkstäder kan ta fram den, och en del bilar visar den i egna menyer eller via app.',
        '**Kontrollera garantin.** Elbilars batterier har normalt en separat garanti som gäller ett visst antal år eller kilometer, ofta med en garanterad lägsta kapacitet. Ta reda på hur mycket som återstår på just den bilen — det är en av de största värdeskillnaderna mellan två annars likvärdiga exemplar.',
        '**Testa en snabbladdning.** Om möjligt, se hur bilen laddar från låg batterinivå. Kraftigt begränsad effekt kan tyda på batteri- eller kylningsproblem.',
        '**Fråga om laddvanor.** Mycket snabbladdning och att bilen ofta stått fullt laddad i värme sliter batteriet mer än långsam hemmaladdning.',
      ],
    },
    { type: 'h2', text: 'Är en begagnad elbil billigare att äga?' },
    {
      type: 'p',
      text: 'Oftast ja, i löpande drift. Energikostnaden per mil är lägre än för bensin om du kan ladda hemma, och en elbil har inga oljebyten, ingen kamrem, inget avgassystem och mindre bromsslitage tack vare motorbromsning. Försäkringen kan däremot vara högre eftersom elbilar ofta har hög effekt och dyra reservdelar, och skattereglerna påverkar totalen.',
    },
    {
      type: 'p',
      text: 'Den stora osäkerheten är värdeminskningen. Elbilar har tappat värde snabbare än jämförbara bensinbilar under de senaste årens prisfall. Det är dåligt om du köper nytt — men bra om du köper begagnat, eftersom någon annan redan tagit den kostnaden.',
    },
    { type: 'h2', text: 'Vilka misstag är vanligast vid elbilsköp?' },
    {
      type: 'ul',
      items: [
        '**Att köpa på annonsens räckvidd.** Siffran är uppmätt under ideala förhållanden, inte i februari på E4:an.',
        '**Att missa värmepumpen.** Bilar utan värmepump drar betydligt mer energi till uppvärmning på vintern.',
        '**Att glömma laddkabel och laddbox.** Rätt kabel ska finnas med, och hemmaladdning kräver installation som kostar pengar.',
        '**Att inte kolla laddhastigheten.** Två bilar med samma räckvidd kan skilja en halvtimme per laddstopp på en långresa.',
        '**Att ignorera bilens mjukvaruhistorik.** Uppdateringar och åtgärdade servicekampanjer säger mycket om hur bilen skötts.',
      ],
    },
    {
      type: 'search',
      label: 'Låt Clutch jämföra elbilar mot bensinbilar i samma prisklass',
      query: 'Jämför begagnade elbilar och bensinbilar i samma prisklass för mig som pendlar och kan ladda hemma',
    },
  ],
  faq: [
    {
      question: 'Hur många år håller ett elbilsbatteri?',
      answer:
        'Moderna batterier är byggda för att hålla bilens livslängd och tappar mest kapacitet under de första åren, därefter långsammare. Utgå från batterihälsorapporten på det aktuella exemplaret snarare än generella tumregler.',
    },
    {
      question: 'Är det dumt att köpa elbil utan möjlighet att ladda hemma?',
      answer:
        'Nej, men då blir laddhastigheten och tillgången till laddare nära dig avgörande — och driftkostnaden högre, eftersom publik laddning kostar mer än hemmaladdning.',
    },
    {
      question: 'Hur mycket räckvidd tappar en elbil på vintern?',
      answer:
        'Räkna med 20–30 procent lägre räckvidd i kyla, mer vid mycket motorvägskörning. Bilar med värmepump klarar sig bättre.',
    },
    {
      question: 'Vad kostar det att byta batteri?',
      answer:
        'Ett batteribyte utanför garantin är en av de dyraste tänkbara reparationerna, vilket är precis därför garantistatus och batterihälsa ska kontrolleras innan köp. Begär prisuppgift från märkesverkstad för den specifika modellen.',
    },
  ],
  related: ['elbil-eller-bensinbil-begagnad', 'billigaste-bilen-att-aga', 'tesla-model-3-begagnad'],
};
