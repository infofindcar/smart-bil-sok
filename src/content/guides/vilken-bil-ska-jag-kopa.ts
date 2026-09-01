import type { Guide } from './types';

export const guide: Guide = {
  slug: 'vilken-bil-ska-jag-kopa',
  title: 'Vilken bil ska jag köpa?',
  metaTitle: 'Vilken bil ska jag köpa? Så väljer du rätt | FindCar',
  metaDescription:
    'Osäker på vilken bil du ska köpa? Följ fem steg: behov, budget, drivmedel, storlek och kontroll — och få förslag som matchar din körprofil.',
  excerpt:
    'Frågan är egentligen fem frågor. Svara på dem i rätt ordning och listan går från hundratals modeller till en handfull som faktiskt passar dig.',
  category: 'Vilken bil ska du välja?',
  readingMinutes: 7,
  updated: '2026-09-01',
  answer:
    'Börja aldrig med modellen — börja med din körprofil. Bestäm i tur och ordning: hur många mil du kör per år, hur mycket du kan lägga per månad totalt (inte bara på inköpet), hur många personer och hur mycket last du behöver plats för, och om du kan ladda hemma. Först när de fyra svaren finns blir drivmedel och modell en enkel följdfråga. De flesta som ångrar ett bilköp har valt bil först och räknat på kostnaden efteråt.',
  blocks: [
    {
      type: 'p',
      text: 'Det finns tusentals begagnade bilar till försäljning i Sverige varje dag, och de flesta av dem är fel för dig. Den här guiden ger dig ordningen att välja i, så att du slipper jämföra modeller som aldrig var relevanta.',
    },
    { type: 'h2', text: 'Steg 1: Hur mycket kör du – och var?' },
    {
      type: 'p',
      text: 'Körsträckan och typen av körning styr drivmedelsvalet mer än något annat.',
    },
    {
      type: 'table',
      headers: ['Årlig körsträcka', 'Typisk körning', 'Drivmedel som brukar vinna'],
      rows: [
        ['Under 1 000 mil', 'Mest stad och närområde', 'Bensin, hybrid eller mindre elbil'],
        ['1 000–2 000 mil', 'Blandad pendling', 'Elbil om du kan ladda hemma, annars bensin eller hybrid'],
        ['Över 2 000 mil', 'Mycket landsväg och motorväg', 'Diesel eller elbil med lång räckvidd'],
        ['Ojämnt: korta dagar, långa semestrar', 'Pendling plus enstaka långresor', 'Laddhybrid om du laddar dagligen'],
      ],
    },
    { type: 'h2', text: 'Steg 2: Vad kostar bilen per månad – på riktigt?' },
    {
      type: 'p',
      text: 'Sätt en månadsbudget som täcker allt, inte bara annonspriset:',
    },
    {
      type: 'ul',
      items: [
        '**Drivmedel eller el** utifrån din faktiska körsträcka',
        '**Försäkring** — begär offert på de modeller du överväger, premien varierar mer än folk tror',
        '**Fordonsskatt** för det specifika exemplaret',
        '**Service och slitdelar** — däck, bromsar, olja, batteri',
        '**Värdeminskning** — stor på nyare bilar, liten på bilar som redan tappat merparten av värdet',
        '**Eventuell räntekostnad** om du lånar',
      ],
    },
    {
      type: 'p',
      text: 'Två bilar med samma pris kan skilja över tusen kronor i månaden i totalkostnad. Det är den siffran du ska jämföra, inte prislappen.',
    },
    {
      type: 'search',
      label: 'Låt Clutch föreslå bilar utifrån din budget',
      query: 'Jag vet inte vilken bil jag ska köpa. Hjälp mig hitta rätt utifrån min budget och hur jag kör.',
    },
    { type: 'h2', text: 'Steg 3: Hur mycket plats behöver du?' },
    {
      type: 'ul',
      items: [
        '**En till två personer, lite bagage** → småbil eller kompaktbil',
        '**Familj med barnstolar** → kombi, kompakt SUV eller halvkombi med stort bagage',
        '**Släp, husvagn eller mycket last** → större kombi eller SUV med godkänd dragvikt',
        '**Fler än fem personer regelbundet** → sjusitsig SUV eller minibuss',
      ],
    },
    {
      type: 'p',
      text: 'Mät hellre än gissa: om du har barnvagn, hund eller sportutrustning, ta med det du faktiskt lastar när du provkör.',
    },
    { type: 'h2', text: 'Steg 4: Vilka modeller gallrar du fram?' },
    {
      type: 'ol',
      items: [
        'Välj tre till fem modeller som uppfyller storlek och drivmedel — inte fler.',
        'Läs på om kända svagheter för de årsmodeller du siktar på, och vilka motorer som anses mest hållbara.',
        'Jämför pris mot minst fem till tio liknande exemplar av varje modell för att lära dig prisbilden.',
        'Prioritera exemplar med dokumenterad service framför lägsta pris.',
        'Boka provkörning på minst två olika bilar innan du bestämmer dig — jämförelsen gör dig till en bättre bedömare.',
      ],
    },
    { type: 'h2', text: 'Steg 5: Vad kontrollerar du innan du skriver på?' },
    {
      type: 'p',
      text: 'Gå igenom servicehistorik, besiktningsprotokoll, ägarhistorik, eventuella skulder på bilen och att uppgifterna i annonsen stämmer med registreringsbeviset. Vid minsta tvekan: låt en oberoende verkstad göra en köpbesiktning. Kostnaden är låg jämfört med vad ett dolt fel kan bli.',
    },
    {
      type: 'search',
      label: 'Se bilar som matchar din körprofil',
      query: 'Beskriv gärna vilka bilar som passar mig: familj, blandad körning och budget kring 150 000 kr',
    },
  ],
  faq: [
    {
      question: 'Ska jag köpa nytt eller begagnat?',
      answer:
        'Begagnat är nästan alltid billigare per mil eftersom värdeminskningen är störst de första åren. Nytt kan motiveras av garanti, finansiering och att du får exakt den utrustning du vill ha.',
    },
    {
      question: 'Hur stor del av min inkomst bör en bil kosta?',
      answer:
        'Det finns ingen officiell gräns, men utgå från din totala månadskostnad för bilen och se att den ryms i din budget även om räntan eller drivmedelspriset stiger.',
    },
    {
      question: 'Är det bättre att köpa av bilfirma eller privatperson?',
      answer:
        'Vid köp av handlare gäller konsumentköplagen, vilket ger ett starkare skydd. Privatköp är ofta billigare men du köper i princip i befintligt skick — kontrollera bilen extra noga.',
    },
    {
      question: 'Hur många modeller ska jag jämföra?',
      answer:
        'Tre till fem räcker. Fler gör att du jämför ytligt istället för att lära dig prisbilden och svagheterna för de modeller du faktiskt kan köpa.',
    },
  ],
  related: ['prisvard-begagnad-bil', 'checklista-innan-bilkop', 'billigaste-bilen-att-aga'],
};
