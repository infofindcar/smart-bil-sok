import type { Guide } from './types';

export const guide: Guide = {
  slug: 'basta-laddhybriden-begagnad',
  title: 'Vilken är den bästa begagnade laddhybriden?',
  metaTitle: 'Bästa begagnade laddhybriden — guide 2026 | FindCar',
  metaDescription:
    'Så väljer du bästa begagnade laddhybriden: elräckvidd, laddning, batterislitage och när en laddhybrid faktiskt är billigare än bensin eller el.',
  excerpt:
    'En laddhybrid är billig i drift — om du laddar den. Så bedömer du elräckvidd, batteriskick och om en laddhybrid verkligen passar dig.',
  category: 'Vilken bil ska du välja?',
  readingMinutes: 7,
  updated: '2026-09-01',
  answer:
    'Den bästa begagnade laddhybriden för dig är den som klarar din vardagskörning på el, som du har praktisk möjlighet att ladda dagligen, och där batteriet visats vara friskt. En laddhybrid vinner över både bensin och el när du kör korta sträckor i vardagen men långt några gånger om året. Kan du inte ladda hemma eller på jobbet är en vanlig hybrid eller bensinbil nästan alltid billigare, eftersom du då släpar med ett tomt batteri och en tyngre bil utan att få nyttan.',
  blocks: [
    {
      type: 'p',
      text: 'Laddhybrider har blivit vanliga på begagnatmarknaden eftersom många köptes som tjänstebilar och nu kommer ut efter tre år. Det ger bra utbud och relativt låga priser, men också en viktig sak att kontrollera: alla tidigare ägare har inte laddat bilarna.',
    },
    { type: 'h2', text: 'När är en laddhybrid rätt val?' },
    {
      type: 'table',
      headers: ['Din situation', 'Bäst val', 'Varför'],
      rows: [
        [
          'Pendlar 2–5 mil per dag, kan ladda hemma, kör långt några gånger per år',
          'Laddhybrid',
          'Vardagen går på el, semestern på bensin utan laddplanering',
        ],
        [
          'Pendlar långt varje dag, kan ladda hemma',
          'Elbil',
          'Lägre driftkostnad och mindre teknik som kan gå sönder',
        ],
        [
          'Kan inte ladda hemma eller på jobbet',
          'Bensin eller vanlig hybrid',
          'En oladdad laddhybrid drar mer än en vanlig bensinbil',
        ],
        [
          'Kör mycket motorväg och långt varje dag',
          'Diesel eller elbil med lång räckvidd',
          'Laddhybridens elräckvidd tar slut direkt på motorväg',
        ],
      ],
    },
    {
      type: 'p',
      text: 'Tumregeln: ju större andel av din årliga körning som består av korta resor, desto mer tjänar du på en laddhybrid.',
    },
    {
      type: 'search',
      label: 'Se begagnade laddhybrider i din prisklass',
      query: 'Jag vill köpa en begagnad laddhybrid som klarar min pendling på el och som jag kan ladda hemma',
    },
    { type: 'h2', text: 'Hur stor elräckvidd behöver du?' },
    {
      type: 'p',
      text: 'Äldre laddhybrider har ofta en angiven elräckvidd på runt 3–5 mil, nyare generationer betydligt mer. På vintern bör du räkna med ungefär en tredjedel mindre, eftersom kupévärmen tar energi ur samma batteri.',
    },
    {
      type: 'ul',
      items: [
        'Utgå från din **längsta normala vardagsresa**, inte snittet.',
        'Kolla om bilen har **bränsledriven eller elektrisk kupévärmare** — en bränsledriven värmare sparar elräckvidd i kyla.',
        'Kontrollera **laddeffekten**. Många laddhybrider laddar bara med 3,7 kW, vilket innebär flera timmars laddning. Det är sällan ett problem hemma över natten, men det gör publik laddning opraktisk.',
      ],
    },
    { type: 'h2', text: 'Vad ska du kontrollera på en begagnad laddhybrid?' },
    {
      type: 'ol',
      items: [
        '**Har bilen laddats?** Titta på snittförbrukningen i bilens dator och på laddkabelns skick. En kabel utan slitspår på en fem år gammal bil är en tydlig signal.',
        '**Batterihälsa.** Be verkstaden läsa ut batteriets status och kontrollera vad som återstår av batterigarantin.',
        '**Bensinmotorns service.** Motorn används mindre men behöver ändå oljebyten enligt tid, inte bara mil. Kontrollera att det gjorts.',
        '**Bromsarna.** Laddhybrider bromsar mycket med motorn, vilket kan göra att bromsskivor rostar av för lite användning. Lyssna och känn efter vid provkörning.',
        '**Laddutrustning.** Att både gatuladdkabel och Typ 2-kabel finns med, samt att laddluckan och laddelektroniken fungerar.',
        '**Tjänstebilshistorik.** Många exemplar har hög körsträcka på kort tid — vilket är okej med dokumenterad service, men ska synas i priset.',
      ],
    },
    { type: 'h2', text: 'Blir en laddhybrid verkligen billigare?' },
    {
      type: 'p',
      text: 'Bara om du laddar. Räkna själv: ta din årliga körsträcka, uppskatta hur stor andel som ryms inom elräckvidden och prissätt den delen med ditt elpris hemma. Resten prissätter du med bensin. Jämför summan med samma körning i en ren bensinbil. Skillnaden är din faktiska besparing — och den brukar bli tydlig för den som laddar dagligen och nästan noll för den som inte gör det.',
    },
    {
      type: 'p',
      text: 'Lägg också in att laddhybrider är mekaniskt mer komplexa än både bensinbilar och elbilar, med två drivsystem som båda kan behöva underhåll. Det gör dokumenterad servicehistorik viktigare här än i nästan någon annan biltyp.',
    },
    {
      type: 'search',
      label: 'Jämför laddhybrid mot elbil för din körprofil',
      query: 'Jämför begagnad laddhybrid och elbil i samma prisklass för mig som pendlar kort men reser långt ibland',
    },
  ],
  faq: [
    {
      question: 'Hur ser jag om en laddhybrid aldrig har laddats?',
      answer:
        'Titta på snittförbrukningen i bilens färddator och på laddkabelns slitage. En hög snittförbrukning och en oanvänd kabel talar starkt för att bilen körts som bensinbil.',
    },
    {
      question: 'Håller batteriet i en laddhybrid lika länge som i en elbil?',
      answer:
        'Batteriet är mindre och används hårdare relativt sin storlek, men laddas oftast långsamt vilket är skonsamt. Utgå från en utläst batteristatus på det specifika exemplaret.',
    },
    {
      question: 'Kan jag snabbladda en laddhybrid?',
      answer:
        'De flesta laddhybrider stödjer bara växelströmsladdning, ofta med begränsad effekt. Räkna med hemmaladdning över natten som normalfall.',
    },
    {
      question: 'Är en vanlig hybrid ett bättre val?',
      answer:
        'Om du inte kan ladda: ofta ja. En vanlig hybrid kräver ingen laddning, är enklare och ger lägre förbrukning än en bensinbil i stadstrafik.',
    },
  ],
  related: ['basta-begagnade-elbilen', 'elbil-eller-bensinbil-begagnad', 'billigaste-bilen-att-aga'],
};
