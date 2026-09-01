import type { Guide } from './types';

export const guide: Guide = {
  slug: 'basta-begagnade-suv',
  title: 'Vilken är den bästa begagnade SUV:en?',
  metaTitle: 'Bästa begagnade SUV — så väljer du rätt modell | FindCar',
  metaDescription:
    'Så väljer du bästa begagnade SUV: storlek, fyrhjulsdrift, dragvikt, driftkostnad och vad du ska kontrollera. Objektiv guide utan provision.',
  excerpt:
    'SUV är inte en biltyp utan fem olika. Så väljer du storlek, drivlina och drivmedel utan att betala för egenskaper du inte behöver.',
  category: 'Vilken bil ska du välja?',
  readingMinutes: 7,
  updated: '2026-09-01',
  answer:
    'Den bästa begagnade SUV:en för dig avgörs av tre saker: hur mycket last och passagerare du faktiskt har, om du behöver fyrhjulsdrift eller bara vinterdäck, och hur många mil du kör per år. Kör du under 1 000 mil om året är bensin eller hybrid oftast billigast totalt; kör du långt och ofta med släp är diesel fortfarande svårslaget. En kompakt SUV räcker för de flesta familjer — större modeller kostar mer i skatt, försäkring, drivmedel och däck utan att ge mer användbart utrymme.',
  blocks: [
    {
      type: 'p',
      text: 'SUV är den mest efterfrågade biltypen i Sverige, vilket betyder både stort utbud och relativt högt pris. Ju tydligare du vet vilket segment du ska titta i, desto mer bil får du för pengarna.',
    },
    { type: 'h2', text: 'Vilken storlek av SUV behöver du?' },
    {
      type: 'table',
      headers: ['Segment', 'Passar för', 'Nackdel'],
      rows: [
        [
          'Liten SUV (t.ex. Renault Captur, Ford Puma, Toyota Yaris Cross)',
          'Två vuxna, en till två barn, mest stadskörning',
          'Begränsat bagage och sällan meningsfull dragvikt',
        ],
        [
          'Kompakt SUV (t.ex. Volvo XC40, VW Tiguan, Kia Sportage, Toyota RAV4)',
          'Familjen som vill ha högre insteg, plats för barnstolar och semesterpackning',
          'Lite dyrare i drift än en kombi med samma utrymme',
        ],
        [
          'Stor SUV (t.ex. Volvo XC60/XC90, Audi Q5, BMW X5)',
          'Släpvagn, husvagn, mycket bagage eller sju sittplatser',
          'Högst kostnad i skatt, försäkring, däck och bränsle',
        ],
        [
          'Coupé-SUV',
          'Den som prioriterar utseende',
          'Sämre bagageutrymme och sikt än motsvarande vanlig SUV',
        ],
      ],
    },
    {
      type: 'p',
      text: 'En vanlig kombi ger ofta lika mycket eller mer lastutrymme än en kompakt SUV, till lägre pris och lägre driftkostnad. Är den högre sittpositionen det du är ute efter är SUV rätt — behöver du bara utrymme, jämför alltid mot kombi innan du bestämmer dig.',
    },
    {
      type: 'search',
      label: 'Se begagnade SUV:ar i din prisklass',
      query: 'Jag vill köpa en begagnad SUV till familjen med bra utrymme och rimlig driftkostnad',
    },
    { type: 'h2', text: 'Behöver du fyrhjulsdrift?' },
    {
      type: 'p',
      text: 'Fyrhjulsdrift hjälper vid start och acceleration på lös eller hal yta — och gör ingen nytta alls när du ska bromsa eller styra. Bra vinterdäck påverkar säkerheten betydligt mer än drivningen.',
    },
    {
      type: 'ul',
      items: [
        '**Välj fyrhjulsdrift** om du bor där vägarna sällan är plogade, har brant uppfart, drar släp eller kör mycket på grusväg och i snö.',
        '**Nöj dig med tvåhjulsdrift** om du mest kör i tätort och på plogade vägar. Du sparar pengar både vid köpet och i drift.',
        '**Kostnaden**: fyrhjulsdrift innebär högre inköpspris, något högre bränsleförbrukning och fler komponenter som kan behöva service.',
      ],
    },
    { type: 'h2', text: 'Vilket drivmedel passar en SUV bäst?' },
    {
      type: 'ul',
      items: [
        '**Bensin** — lägst inköpspris och enklast teknik. Bäst om du kör under ungefär 1 000 mil per år.',
        '**Diesel** — lägst förbrukning på långkörning och bäst dragegenskaper. Kräver dock att bilen får gå varm; enbart korta stadssträckor sliter på partikelfiltret.',
        '**Laddhybrid** — kan gå på el i vardagen och bensin på semestern, men bara om du faktiskt laddar. Utan laddning blir den en tyngre och törstigare bensinbil.',
        '**El** — lägst driftkostnad om du kan ladda hemma, men räckvidden faller markant med släp och i kyla.',
      ],
    },
    { type: 'h2', text: 'Vad ska du kontrollera på en begagnad SUV?' },
    {
      type: 'ol',
      items: [
        '**Servicehistorik på drivlinan.** Fyrhjulsdrift och automatlådor kräver oljebyten enligt schema — be om dokumentation.',
        '**Dragkrok och godkänd dragvikt.** Kontrollera i registreringsbeviset, inte i annonsen.',
        '**Bromsar och däck.** En tung bil sliter mer, och fyra nya däck till en stor SUV är en betydande kostnad.',
        '**Rost och underrede.** Titta särskilt på bilar som gått mycket vinterväg.',
        '**Partikelfilter och kamrem/kamkedja** på dieselmotorer, samt att eventuella servicekampanjer är åtgärdade.',
        '**Elektronik**: backkamera, sensorer, panoramatak och luftfjädring är dyra att laga och bör testas noga vid provkörning.',
      ],
    },
    {
      type: 'p',
      text: 'Räkna också på totalkostnaden innan du väljer. Skillnaden mellan en kompakt och en stor SUV är sällan bara inköpspriset — den syns varje månad i försäkring, skatt, bränsle och slitdelar.',
    },
    {
      type: 'search',
      label: 'Jämför SUV mot kombi i samma prisklass',
      query: 'Jämför en begagnad SUV och en kombi i samma prisklass åt mig — jag vill se vad som är mest prisvärt',
    },
  ],
  faq: [
    {
      question: 'Är en SUV säkrare än en vanlig bil?',
      answer:
        'Inte automatiskt. Säkerheten avgörs av krocksäkerhet och förarstöd, inte av karosstypen. Jämför krocktestresultat och utrustning för de specifika modellerna och årsmodellerna du tittar på.',
    },
    {
      question: 'Hur mycket dyrare är en SUV i drift än en kombi?',
      answer:
        'Typiskt något högre bränsleförbrukning på grund av vikt och luftmotstånd, plus dyrare däck. Skillnaden är oftast måttlig i kompaktklassen och tydlig i den största klassen.',
    },
    {
      question: 'Är höga mil ett större problem på en SUV?',
      answer:
        'Nej, men tyngre bilar sliter mer på bromsar, hjullager och fjädring. Servicehistorik väger därför extra tungt.',
    },
    {
      question: 'Kan jag dra husvagn med en kompakt SUV?',
      answer:
        'Ofta ja, men bara upp till bilens godkända dragvikt och inom din körkortsbehörighet. Kontrollera alltid uppgifterna i registreringsbeviset för det specifika exemplaret.',
    },
  ],
  related: ['basta-begagnade-elbilen', 'billigaste-bilen-att-aga', 'volvo-xc60-begagnad-kop-guide'],
};
