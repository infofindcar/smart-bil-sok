import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';

const Terms = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Användarvillkor</h1>
            <p className="text-sm text-muted-foreground mt-2">Senast uppdaterad: April 2026</p>
            <p className="text-sm leading-relaxed mt-4">
              Genom att använda FindCar (findcar.se) godkänner du dessa villkor. Tjänsten drivs
              som ett <strong>ideellt utvecklingsprojekt av en privatperson</strong> — ingen
              registrerad näringsverksamhet, ingen reklam, ingen provision, gratis för slutkunder.
              Läs även vår <a href="/privacy" className="text-primary hover:underline">integritetspolicy</a>{' '}
              som beskriver hur vi hanterar personuppgifter.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Vad FindCar är (och inte är)</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar är en oberoende sökmotor som hjälper privatpersoner att hitta begagnade
              och nya bilar i Sverige. Vi indexerar publikt tillgängliga annonser från bilfirmor
              och presenterar dem i ett samlat gränssnitt med AI-baserade rekommendationer
              ("Clutch").
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong>FindCar är inte:</strong>
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>En bilförsäljare eller mellanhand i bilköp</li>
              <li>En finansierings- eller försäkringsförmedlare</li>
              <li>En ersättning för Transportstyrelsens officiella register</li>
              <li>Anställd, avtalsbunden eller representant för någon enskild bilfirma</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              All faktisk försäljning, kontraktsskrivning, betalning, leverans och eftermarknad
              sker direkt mellan dig och bilfirman.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Var bilannonserna kommer ifrån</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Annonsdatan är hämtad från offentliga källor på internet enligt följande principer:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Endast bilfirmor</strong> — vi visar aldrig privatannonser eller privatpersoners uppgifter.</li>
              <li><strong>Endast publik information</strong> som redan är öppet publicerad — pris, modell, mil, ort, firmanamn.</li>
              <li><strong>Endast suddiga thumbnail-bilder</strong> i låg upplösning som identifiering. Originalbilden ligger kvar hos källan.</li>
              <li><strong>Trafik förmedlas tillbaka</strong> till annonsgivaren via kontaktformulär eller direkt extern länk — vi konkurrerar inte med originalkällan.</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Eftersom annonser uppdateras hos ursprungskällan kan information vara
              inaktuell innan vår nästa synkronisering. <strong>Verifiera alltid uppgifterna direkt
              hos säljaren</strong> innan du fattar köpbeslut.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Information om bilarna är vägledande</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bilannonserna har sammanställts från offentliga källor och berikats med
              AI-genererad teknisk data (effekt, drivlina, karosseri, säkerhetsdata m.m.).
              Vi gör vårt bästa för att informationen ska stämma men <strong>kan inte garantera
              att uppgifterna alltid är aktuella, fullständiga eller korrekta</strong>.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Den enda källa som är 100 % tillförlitlig är Transportstyrelsens register —
              använd länken "Kolla bilen hos Transportstyrelsen" på varje bil-sida.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. AI-rådgivning (Clutch)</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Clutch är en AI-baserad sökhjälp som drivs av tredjepart (Google Gemini via
              Lovable AI Gateway). Rekommendationerna är <strong>vägledande</strong> och baseras på
              den information du lämnar samt offentlig fordonsdata. AI:n kan göra fel, missa
              relevanta bilar eller felaktigt rekommendera olämpliga modeller.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Clutch ska <strong>inte</strong> ses som professionellt expertråd, finansiell
              rådgivning eller köprekommendation. Du har enligt GDPR-art. 22 alltid rätt till
              en mänsklig bedömning — kontakta{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Ditt eget ansvar som köpare</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bilköp är ett stort beslut. Du ansvarar själv för att:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Verifiera bilens skick, ägarhistorik och eventuella lån (länken till Transportstyrelsen finns på varje bil-sida)</li>
              <li>Provköra och teknik-besiktiga bilen innan köp</li>
              <li>Förhandla pris och villkor direkt med säljaren</li>
              <li>Säkerställa att försäkring och registrering är på plats vid ägarbyte</li>
              <li>Kontrollera om annonsuppgifterna stämmer (mil, utrustning, skick)</li>
              <li>Granska köpekontraktet innan du undertecknar</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Tredjepartsinnehåll och länkar</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tjänsten innehåller länkar till externa sajter (Transportstyrelsen, säljarens
              egen hemsida, m.fl.). Vi ansvarar inte för innehåll eller tillgänglighet på
              dessa sajter — de följer sina egna villkor och integritetspolicyer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Tillåten användning</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Du får använda FindCar för personliga, icke-kommersiella syften — att hitta en
              bil till dig själv eller någon nära. Det är <strong>inte tillåtet</strong> att:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Skrapa, indexera eller automatiskt hämta data från FindCar</li>
              <li>Återpublicera vårt innehåll utan tillstånd</li>
              <li>Använda tjänsten för att skicka spam eller störa funktionen</li>
              <li>Försöka kringgå tekniska begränsningar (rate limits, CORS) eller säkerhetsåtgärder</li>
              <li>Använda tjänsten för olagliga ändamål eller bedrägeri</li>
              <li>Skicka falska kontaktförfrågningar till säljare</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">8. Information för bilförsäljare</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar visar publikt tillgängliga annonser från bilfirmor i hela Sverige. Är du
              annonsgivare och <strong>inte</strong> vill att dina annonser ska indexeras hos oss —
              skicka ett mejl till{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>{' '}
              med firmanamn (eller organisationsnummer). Vi:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1 pl-5">
              <li>Tar bort befintliga annonser inom <strong>7 dagar</strong></li>
              <li>Lägger till er på en blockeringslista så de inte återimporteras</li>
              <li>Bekräftar via mejl när det är klart</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ingen motivering krävs och vi diskuterar inte beslutet. Som annonsgivare har du
              även de GDPR-rättigheter som beskrivs i vår integritetspolicy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">9. Driftavbrott och tillgänglighet</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar är ett hobbyprojekt. Vi gör <strong>inga garantier</strong> kring tillgänglighet,
              prestanda eller funktionalitet. Tjänsten kan vara nere för underhåll,
              uppdateringar eller på grund av tekniska problem utan förvarning. Om sajten
              stängs ner permanent kommer datan raderas — du har inget kvarstående krav på oss.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">10. Ansvarsbegränsning</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              I den utsträckning lagen tillåter ansvarar FindCar inte för:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Indirekta skador, utebliven vinst, dataförlust eller följdskador</li>
              <li>Felaktiga eller inaktuella annonsuppgifter</li>
              <li>Beslut du fattar baserat på Clutch-rekommendationer</li>
              <li>Tvister, kontraktsbrott eller annat mellan dig och bilfirman</li>
              <li>Bilens skick efter köp</li>
              <li>Bedrägeri eller missbruk från enskilda säljare</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Eftersom tjänsten är gratis och drivs ideellt finns inga ekonomiska åtaganden
              eller leveransgarantier mellan dig och oss. Detta begränsar inte konsumenters
              tvingande rättigheter enligt svensk konsumentlagstiftning där sådana är
              tillämpliga.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">11. Skadeersättning</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Om du missbrukar tjänsten på ett sätt som orsakar skada (t.ex. genom att skrapa
              vår data, skicka spam eller utföra angrepp) förbehåller vi oss rätten att
              vidta nödvändiga åtgärder, inklusive blockering, polisanmälan vid allvarliga
              fall och rättslig prövning.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">12. Ändringar i villkoren</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vi kan uppdatera dessa villkor när tjänsten utvecklas. Datumet ovan visar
              senaste uppdatering. Stora ändringar meddelar vi via en banner på startsidan.
              Fortsatt användning efter en uppdatering räknas som godkännande av de nya
              villkoren.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">13. Tillämplig lag och tvister</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Svensk lag tillämpas. Eventuella tvister mellan dig som konsument och FindCar
              ska i första hand lösas genom dialog via{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>.
              Om vi inte når en lösning kan tvisten prövas av Allmänna reklamationsnämnden
              (ARN) eller svensk allmän domstol där svensk konsumentlagstiftning är tillämplig.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Kontakt
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Frågor, ärenden eller synpunkter — skicka mejl till{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline font-medium">info@findcar.se</a>.
              Vi svarar normalt inom några arbetsdagar.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
