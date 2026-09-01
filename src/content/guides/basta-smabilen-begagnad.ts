import type { Guide } from './types';

export const guide: Guide = {
  slug: 'basta-smabilen-begagnad',
  title: 'Vilken är den bästa begagnade småbilen?',
  metaTitle: 'Bästa begagnade småbilen — billig och pålitlig | FindCar',
  metaDescription:
    'Så väljer du bästa begagnade småbilen: låg driftkostnad, pålitlighet, säkerhet och vad du ska kontrollera. Bra guide för första bilen eller andrabilen.',
  excerpt:
    'Småbilen är den billigaste vägen till egen bil — men skillnaden mellan ett bra och ett dåligt exemplar är större här än i något annat segment.',
  category: 'Vilken bil ska du välja?',
  readingMinutes: 6,
  updated: '2026-09-01',
  answer:
    'Den bästa begagnade småbilen är den som har lägst totalkostnad över din ägandetid — inte den som är billigast i annonsen. Prioritera dokumenterad servicehistorik, låg fordonsskatt, billiga och vanliga reservdelar samt en motor utan känsliga konstruktioner. En något dyrare småbil med komplett servicebok blir nästan alltid billigare än ett billigt exemplar med okänd historik, eftersom en enda större reparation kan överstiga hela prisskillnaden.',
  blocks: [
    {
      type: 'p',
      text: 'Småbilar köps oftast som första bil, andrabil eller pendlarbil. Det gör priset viktigt — men det är också därför många exemplar är dåligt skötta. En småbil som gått i stadstrafik i tio år med minimalt underhåll är en helt annan produkt än samma modell med full service.',
    },
    { type: 'h2', text: 'Vad gör en småbil billig att äga?' },
    {
      type: 'ul',
      items: [
        '**Låg fordonsskatt** — styrs av utsläpp och drivmedel. Kontrollera skatten för det specifika exemplaret innan du köper.',
        '**Låg försäkringspremie** — påverkas av modell, motorstyrka, din ålder och var du bor. Begär offert före köp, inte efter.',
        '**Billiga slitdelar** — vanliga modeller har fler reservdelsalternativ och lägre priser på däck, bromsar och batteri.',
        '**Enkel teknik** — färre elektroniska system betyder färre dyra fel på en gammal bil.',
        '**Låg förbrukning** — men skillnaden mellan småbilar är sällan avgörande. Skatt, försäkring och reparationer väger ofta tyngre.',
      ],
    },
    {
      type: 'p',
      text: 'Räkna alltid på kronor per månad, inte på inköpspriset. En bil för 45 000 kr med hög skatt och en känd svaghet kan bli dyrare på två år än en för 75 000 kr med låg skatt och full service.',
    },
    {
      type: 'search',
      label: 'Se billiga småbilar med låg driftkostnad',
      query: 'Jag vill hitta en billig och pålitlig begagnad småbil med låg driftkostnad',
    },
    { type: 'h2', text: 'Vilket segment ska du titta i?' },
    {
      type: 'table',
      headers: ['Behov', 'Segment', 'Typiska modeller att jämföra'],
      rows: [
        [
          'Billigast möjligt, mest stadskörning',
          'Minsta klassen',
          'Toyota Aygo, Peugeot 108, Citroën C1, VW up!, Kia Picanto',
        ],
        [
          'Första bilen, blandad körning',
          'Småbilsklassen',
          'Toyota Yaris, Ford Fiesta, Renault Clio, Škoda Fabia, Hyundai i20',
        ],
        [
          'Behöver plats för barnstol och lite bagage',
          'Kompaktklassen (nedre)',
          'VW Golf, Škoda Octavia, Toyota Corolla, Kia Ceed',
        ],
        [
          'Vill undvika bensin helt',
          'Liten elbil eller hybrid',
          'Nissan Leaf, Renault Zoe, Toyota Yaris Hybrid',
        ],
      ],
    },
    { type: 'h2', text: 'Vad ska du kontrollera på en billig småbil?' },
    {
      type: 'ol',
      items: [
        '**Rost** — särskilt hjulhus, tröskellådor, bakre fjäderben och under mattorna i bagaget.',
        '**Kamrem eller kamkedja** — ta reda på intervallet för just den motorn och om bytet är gjort och dokumenterat.',
        '**Kopplingen** på manuell växellåda och **växlingskvaliteten** på automat, särskilt på bilar som gått mycket i stadstrafik.',
        '**Besiktningshistoriken** — återkommande anmärkningar på samma punkt tyder på att något aldrig åtgärdats ordentligt.',
        '**Kylsystem och oljeläckage** — titta efter torkade spår under motorn och kontrollera kylarvätskans nivå och färg.',
        '**Kallstart** — starta bilen kall. Många fel hörs bara de första sekunderna.',
      ],
    },
    { type: 'h2', text: 'Hur mycket säkerhet får du i en småbil?' },
    {
      type: 'p',
      text: 'Modern småbil är betydligt säkrare än en gammal, och skillnaden är stor mellan årsmodeller. Jämför krocktestresultat för de specifika modellerna och åren du tittar på, och prioritera bilar med antisladdsystem samt sidokrockgardiner. Är bilen tänkt som första bil för en ung förare är säkerhetsutrustningen ofta värd mer än några tusenlappar lägre pris.',
    },
    {
      type: 'p',
      text: 'Tänk också på att en småbil ofta blir det exemplar som körs hårdast: korta sträckor, kalla starter och sena serviceintervall. Det är precis därför servicehistoriken är det viktigaste dokumentet i hela affären.',
    },
    {
      type: 'search',
      label: 'Hitta en småbil med dokumenterad service',
      query: 'Visa begagnade småbilar med låg körsträcka och dokumenterad servicehistorik',
    },
  ],
  faq: [
    {
      question: 'Hur gammal bil kan man köpa utan att det blir dyrt?',
      answer:
        'Åldern spelar mindre roll än underhållet. En tio år gammal bil med komplett service och låg körsträcka är oftast tryggare än en fem år gammal med okänd historik.',
    },
    {
      question: 'Är manuell eller automat bäst i en småbil?',
      answer:
        'Manuell är enklare och billigare att underhålla. Automat är bekvämare i stadstrafik men kan vara en dyr reparation om den missköts — kontrollera att oljebyten gjorts enligt tillverkarens schema.',
    },
    {
      question: 'Är det värt att köpa en småbil med hög körsträcka?',
      answer:
        'Kan vara det, om körningen mest varit landsväg och servicen är dokumenterad. Stadsmil sliter mer per mil än landsvägsmil.',
    },
    {
      question: 'Hur mycket ska jag budgetera för oväntade reparationer?',
      answer:
        'Lägg undan en buffert för slitdelar redan från början. På en äldre billig bil är däck, bromsar och batteri poster som ofta dyker upp under första året.',
    },
  ],
  related: ['prisvard-begagnad-bil', 'checklista-innan-bilkop', 'billigaste-bilen-att-aga'],
};
