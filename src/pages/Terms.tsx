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
              som ett ideellt utvecklingsprojekt av en privatperson — ingen registrerad
              näringsverksamhet, ingen reklam, ingen provision, gratis för slutkunder. Läs
              även vår <a href="/privacy" className="text-primary hover:underline">integritetspolicy</a>{' '}
              som beskriver hur vi hanterar personuppgifter.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Vad FindCar är</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar är en oberoende sökmotor som hjälper privatpersoner att hitta begagnade
              och nya bilar i Sverige. Vi indexerar publikt tillgängliga annonser från flera
              källor och presenterar dem i ett samlat gränssnitt med AI-baserade
              rekommendationer ("Clutch"). FindCar är <strong>inte</strong> en bilförsäljare —
              all försäljning sker direkt mellan kund och annonsgivare.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Information om bilarna</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Bilannonserna har sammanställts från offentliga källor och uppdateras regelbundet,
              men <strong>vi kan inte garantera att uppgifterna alltid är aktuella eller
              korrekta</strong>. Pris, mil, tillgänglighet och utrustning kan ändras hos
              annonsgivaren utan att vi hinner uppdatera. Verifiera alltid uppgifterna direkt
              hos säljaren och hos Transportstyrelsen innan du fattar ett köpbeslut.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              AI-rekommendationerna från Clutch är <strong>vägledande</strong> och baseras på
              den information du lämnat samt offentlig fordonsdata. De ska inte ses som
              expertråd eller köprekommendation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Ditt eget ansvar</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Du ansvarar själv för att:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Verifiera bilens skick, ägarhistorik och eventuella lån (länken till Transportstyrelsen finns på varje bil-sida)</li>
              <li>Provköra och eventuellt teknik-besiktiga bilen innan köp</li>
              <li>Förhandla pris och villkor direkt med säljaren</li>
              <li>Säkerställa att försäkring och registrering är på plats vid ägarbyte</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar tar <strong>inget ansvar</strong> för affären mellan dig och säljaren,
              för bilens skick efter köp, eller för eventuella tvister mellan dig och annonsgivaren.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Tredjepartsinnehåll och länkar</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Tjänsten innehåller länkar till externa sajter (t.ex. Transportstyrelsen,
              annonsgivarens egen hemsida). Vi ansvarar inte för innehållet eller
              tillgängligheten på dessa sajter — de följer sina egna villkor och
              integritetspolicyer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Tillåten användning</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Du får använda FindCar för personliga, icke-kommersiella syften — att hitta en
              bil till dig själv eller någon nära. Det är <strong>inte tillåtet</strong> att:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Skrapa, indexera eller automatiskt hämta data från FindCar</li>
              <li>Återpublicera vårt innehåll utan tillstånd</li>
              <li>Använda tjänsten för att skicka spam eller på något sätt störa funktionen</li>
              <li>Försöka kringgå tekniska begränsningar eller säkerhetsåtgärder</li>
              <li>Använda tjänsten för olagliga ändamål</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Är du bilförsäljare?</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar visar publikt tillgängliga annonser från flera källor. Om du är
              bilförsäljare och <strong>inte</strong> vill att dina annonser ska indexeras hos
              oss — skicka ett mejl till{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>{' '}
              med ditt firmanamn (eller organisationsnummer). Vi:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1 pl-5">
              <li>Tar bort befintliga annonser inom <strong>7 dagar</strong></li>
              <li>Lägger till er på en blockeringslista så de inte återimporteras</li>
              <li>Bekräftar via mejl när det är klart</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Ingen motivering krävs och vi diskuterar inte beslutet — vi respekterar er
              önskan utan följdfrågor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Driftavbrott och tillgänglighet</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar är ett hobbyprojekt och vi gör inga garantier kring tillgänglighet eller
              prestanda. Tjänsten kan vara nere för underhåll, uppdateringar eller på grund av
              tekniska problem utan förvarning.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">8. Ansvarsbegränsning</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              I den utsträckning lagen tillåter, ansvarar FindCar inte för indirekta skador,
              utebliven vinst, dataförlust eller andra följdskador kopplade till användningen
              av tjänsten. Eftersom tjänsten är gratis och drivs ideellt finns inga
              ekonomiska åtaganden eller leveransgarantier mellan dig och oss.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">9. Ändringar i villkoren</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vi kan uppdatera dessa villkor när tjänsten utvecklas. Datumet ovan visar
              senaste uppdatering. Stora ändringar meddelar vi via en banner på startsidan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">10. Tillämplig lag</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Svensk lag tillämpas. Eventuella tvister hanteras enligt svensk
              konsumentlagstiftning där det är tillämpligt.
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
