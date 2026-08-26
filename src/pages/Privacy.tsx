import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';
import { SEO } from '@/components/SEO';

const Privacy = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Integritetspolicy | FindCar"
        description="Så hanterar FindCar dina personuppgifter enligt GDPR. Läs vilka uppgifter vi samlar in, varför, hur länge och dina rättigheter."
        path="/privacy"
      />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Integritetspolicy</h1>
            <p className="text-sm text-muted-foreground mt-2">Senast uppdaterad: Augusti 2026</p>
            <p className="text-sm leading-relaxed mt-4">
              FindCar (findcar.se) är en gratis sökmotor som hjälper privatpersoner att hitta
              rätt bil med hjälp av AI. Den här policyn beskriver vilka uppgifter vi samlar
              in, på vilken laglig grund, hur länge, och vilka rättigheter du har enligt
              dataskyddsförordningen (GDPR).
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Vem är personuppgiftsansvarig</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar drivs som ett <strong>ideellt utvecklingsprojekt av en privatperson</strong> —
              inte som registrerad näringsverksamhet. Tjänsten är gratis för slutkunder, säljer
              ingen reklam, tar inga provisioner och har ingen kommersiell verksamhet. Eftersom
              behandlingen är begränsad och småskalig har vi inte utsett ett dataskyddsombud
              (DPO) — det är inte heller ett krav enligt GDPR-art. 37 för verksamhet av vår typ.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Kontakt för alla integritetsfrågor:{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Vilka uppgifter vi samlar in</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">När du använder FindCar samlar vi in följande:</p>
            <div className="space-y-3 text-sm leading-relaxed">
              <div>
                <strong className="text-foreground">Kontaktuppgifter (när du fyller i kontaktformulär):</strong>
                <p className="text-muted-foreground mt-1">Namn, e-postadress, telefonnummer (valfritt) och meddelande som du frivilligt lämnar för att kontakta en bilförsäljare.</p>
              </div>
              <div>
                <strong className="text-foreground">Konversation med Clutch (vår AI-rådgivare):</strong>
                <p className="text-muted-foreground mt-1">
                  Det du skriver i AI-chatten — t.ex. budget, livssituation, önskemål — sparas
                  endast tillfälligt i din webbläsare (sessionStorage) och raderas automatiskt
                  när du stänger fliken. Vi sparar ingen permanent kopia av konversationen.
                </p>
              </div>
              <div>
                <strong className="text-foreground">Sparade bilar och preferenser:</strong>
                <p className="text-muted-foreground mt-1">
                  Bilar du markerar som favoriter sparas lokalt i din webbläsare. Lämnar aldrig din enhet.
                </p>
              </div>
              <div>
                <strong className="text-foreground">Teknisk information (om du accepterar statistik-cookies):</strong>
                <p className="text-muted-foreground mt-1">
                  Besökta sidor, webbläsartyp och klickbeteende. Samlas bara in om du klickar
                  "Acceptera alla" i cookie-bannern. IP-adress hanteras bara kortvarigt i
                  serverfunktioner för missbruksskydd — vi sparar den aldrig i klartext i databasen.
                  För hastighetsbegränsning (max 3 AI-sökningar/dag och max 3 annonsanalyser/dag)
                  lagrar vi en kryptografisk hash (SHA-256) av IP-adressen — detta är inte möjligt
                  att återföra till en faktisk IP-adress.
                </p>
              </div>
              <div>
                <strong className="text-foreground">Intresseanmälan (väntelista):</strong>
                <p className="text-muted-foreground mt-1">
                  Förnamn, efternamn och e-postadress som du frivilligt lämnar när du anmäler
                  intresse för FindCar. Används enbart för att meddela dig när tjänsten lanseras.
                </p>
              </div>
              <div>
                <strong className="text-foreground">Förbättringsförslag (feedback-formuläret):</strong>
                <p className="text-muted-foreground mt-1">
                  Det du skriver i feedback-formuläret samt, om du väljer att uppge det, din
                  e-postadress. Vi sparar även vilken sida du var på när du skickade förslaget.
                  E-post är helt frivilligt — du kan skicka feedback anonymt.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Laglig grund för behandlingen</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enligt GDPR-artikel 6 har vi en specifik laglig grund för varje typ av behandling:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Kontaktformulär:</strong> samtycke (art. 6.1.a) + nödvändigt för åtgärd på din begäran (art. 6.1.b).</li>
              <li><strong>Clutch-konversation:</strong> samtycke (du startar chatten frivilligt). Datan lämnar aldrig din enhet i permanent form.</li>
              <li><strong>Statistik-cookies (besökta sidor, webbläsartyp):</strong> samtycke (art. 6.1.a) — kräver att du klickar "Acceptera alla".</li>
              <li><strong>IP-hash för hastighetsbegränsning:</strong> berättigat intresse (art. 6.1.f) — att skydda tjänsten mot missbruk.</li>
              <li><strong>Intresseanmälan (väntelista):</strong> samtycke (art. 6.1.a) — du anmäler dig frivilligt.</li>
              <li><strong>Förbättringsförslag:</strong> berättigat intresse (art. 6.1.f) — att kunna förbättra tjänsten baserat på frivillig feedback.</li>
              <li><strong>Tekniska loggar för säkerhet:</strong> berättigat intresse — att förebygga missbruk och fel.</li>
              <li><strong>Indexering av offentliga bilannonser från bilfirmor:</strong> berättigat intresse — att hjälpa konsumenter hitta bilar; ingen personuppgift om privatperson behandlas (se punkt 6).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Hur vi använder uppgifterna</h2>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Att leverera Clutch-rekommendationer som matchar dina preferenser.</li>
              <li>Att förmedla din kontaktförfrågan till bilförsäljaren du valt (se punkt 5).</li>
              <li>Att förbättra tjänsten — statistik om vad som söks och vad som fungerar bra (kräver samtycke).</li>
              <li>Att läsa och agera på frivillig feedback från förbättringsformuläret.</li>
              <li>Att meddela dig per e-post när tjänsten lanseras (väntelista).</li>
              <li>Att förebygga missbruk och tekniska fel.</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vi använder data <strong>aldrig</strong> för marknadsföring, profilering till externa
              parter eller försäljning.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Delning med tredje part</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">När du fyller i kontaktformuläret för en bil:</strong> dina kontaktuppgifter och meddelandet skickas via e-post till
              den bilförsäljare som annonserar bilen, så att de kan kontakta dig. Säljaren
              hanterar därefter uppgifterna enligt sin egen integritetspolicy och blir
              självständig personuppgiftsansvarig.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">Personuppgiftsbiträden vi anlitar:</strong> vi har skrivit eller accepterat
              personuppgiftsbiträdesavtal (DPA) med varje leverantör nedan i enlighet med
              GDPR-art. 28.
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1 pl-5">
              <li><strong>Supabase Inc.</strong> — databas, autentisering, edge functions. Server i EU (Irland). DPA: <a href="https://supabase.com/legal/dpa" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">supabase.com/legal/dpa</a>.</li>
              <li><strong>Lovable AI Gateway / Google Gemini</strong> — AI-modell som driver Clutch-rådgivaren. Se punkt 9 om tredjelandsöverföring.</li>
              <li><strong>Resend</strong> — e-postutskick av kontaktförfrågningar till säljare.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Var bilannonserna kommer ifrån</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar är en <strong>oberoende sökmotor</strong> som indexerar publikt
              tillgängliga bilannonser från flera källor på internet. Vi behandlar bara
              annonser som möter följande kriterier:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Endast bilfirmor</strong> — vi visar aldrig privatannonser. Säljarens organisationsnamn och ort är firmadata, inte personuppgifter.</li>
              <li>
                <strong>Endast offentlig fordons- och firmadata</strong> — t.ex. pris, modell,
                årsmodell, miltal, registreringsnummer, karosseri, drivmedel, växellåda, drivlina,
                effekt, antal säten, dragvikt, färg, skatteklass, första registreringsdatum, ort,
                firmanamn samt länk till annonsen. All denna information är redan publicerad öppet
                av bilfirman själv på publika annonsplatser online.
              </li>
              <li>
                <strong>Bilden lagras aldrig hos oss</strong> — vi sparar bara en länk (URL) till
                thumbnail-bilden, som ligger kvar hos den externa server där den ursprungligen
                publicerats. När du ser en bild på FindCar laddas den direkt från den externa
                servern, inte från oss.
              </li>
              <li><strong>Inga privatpersoners namn eller telefonnummer</strong> sparas eller visas någonsin.</li>
              <li><strong>Vi konkurrerar inte med ursprungsannonserna</strong> — kunder som vill kontakta säljaren skickas vidare via kontaktformulär eller direkt extern länk.</li>
            </ul>
            <div className="rounded-lg border border-border bg-card/50 p-4 mt-3">
              <p className="text-foreground text-sm leading-relaxed font-medium mb-2">
                Information för bilförsäljare och annonsgivare
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Vill du <strong>inte</strong> att dina annonser ska synas på FindCar? Skicka ett mejl
                till <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>{' '}
                med ditt firmanamn (eller organisationsnummer). Vi tar bort era annonser
                inom <strong>7 dagar</strong>, lägger till er på en blockeringslista så de inte
                återimporteras, och bekräftar via mejl när det är klart. <strong>Ingen motivering krävs</strong>.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                Som annonsgivare har du även rätt att få veta vilka uppgifter vi har om er
                firma, få felaktiga uppgifter rättade, eller begära radering enligt GDPR
                (rättigheterna i punkt 9).
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Hur länge vi sparar data</h2>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Clutch-konversationer:</strong> raderas automatiskt när du stänger webbläsarfliken.</li>
              <li><strong>Kontaktförfrågningar (leads):</strong> sparas i 2 år, sedan raderas de automatiskt. Du kan när som helst begära radering dessförinnan — se punkt 11.</li>
              <li><strong>Statistik-events (besöksdata):</strong> 90 dagar, sedan raderas automatiskt.</li>
              <li><strong>IP-hash för hastighetsbegränsning:</strong> 90 dagar, sedan raderas automatiskt.</li>
              <li><strong>Förbättringsförslag:</strong> 90 dagar, sedan raderas automatiskt.</li>
              <li><strong>Väntelista:</strong> tills tjänsten lanseras och du meddelats, eller tills du begär radering.</li>
              <li><strong>Tekniska loggar:</strong> 30 dagar, sedan rensas automatiskt.</li>
              <li><strong>Bilannonser från bilfirmor:</strong> uppdateras dagligen — annonser som inte längre är aktiva hos källan tas bort vid nästa synkronisering.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">8. Cookies och liknande tekniker</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Vi använder följande cookies/lokal lagring:</p>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-semibold">Namn</th>
                    <th className="text-left p-2 font-semibold">Typ</th>
                    <th className="text-left p-2 font-semibold">Syfte</th>
                    <th className="text-left p-2 font-semibold">Varaktighet</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border/50">
                    <td className="p-2 font-mono">findcar_cookie_consent</td>
                    <td className="p-2">Nödvändig</td>
                    <td className="p-2">Kommer ihåg ditt cookie-val</td>
                    <td className="p-2">Tillsvidare</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-2 font-mono">findcar-search-state</td>
                    <td className="p-2">Funktionell</td>
                    <td className="p-2">Sparar Clutch-konversation under sessionen</td>
                    <td className="p-2">Sessionen</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="p-2 font-mono">findcar-saved-cars</td>
                    <td className="p-2">Funktionell</td>
                    <td className="p-2">Bilar du markerat som favorit</td>
                    <td className="p-2">Tillsvidare (lokalt)</td>
                  </tr>
                  <tr>
                    <td className="p-2">Statistik-events</td>
                    <td className="p-2">Statistik</td>
                    <td className="p-2">Mäter klick och visningar (kräver samtycke)</td>
                    <td className="p-2">3 månader</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vi använder <strong>inte</strong> Google Analytics, Meta Pixel eller andra externa
              spårningsverktyg. All statistik är intern och kan inte kopplas till dig som person.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">9. Tredjelandsöverföring</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vår AI-rådgivare Clutch drivs av <strong>Google Gemini</strong> (via Lovable AI Gateway).
              Google är USA-baserat, vilket innebär att din konversation kan bearbetas på
              servrar utanför EU. Detta är en tredjelandsöverföring enligt GDPR-art. 44–49.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Överföringen är skyddad av Googles certifiering enligt <strong>EU-US Data Privacy
              Framework</strong> samt Standard Contractual Clauses (SCC). Eftersom du själv väljer
              vad du skriver i Clutch och vi inte sparar konversationen permanent, är
              risken minimal — men du har alltid rätt att avstå från att använda Clutch och
              istället söka manuellt.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              All annan data (kontaktförfrågningar, statistik, loggar) lagras hos Supabase
              i EU (Irland) och lämnar aldrig EU.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">10. Automatiserat beslutsfattande och AI</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Clutch använder AI för att <strong>föreslå</strong> bilar baserat på din konversation.
              Det är ingen automatiserad bedömning som har rättsliga eller liknande
              betydande effekter på dig — du fattar alltid det slutliga beslutet själv.
              Enligt GDPR-art. 22 har du ändå rätt att:
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Få en mänsklig bedömning istället för AI-rekommendationen — kontakta oss på {' '}
                <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>.
              </li>
              <li>Uttrycka din synpunkt på rekommendationen.</li>
              <li>Bestrida ett resultat du inte håller med om.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">11. Dina rättigheter enligt GDPR</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Du har rätt att:</p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Få veta</strong> vilka uppgifter vi har om dig (registerutdrag).</li>
              <li><strong>Få dina uppgifter raderade</strong> ("rätten att bli glömd").</li>
              <li><strong>Rätta felaktiga uppgifter.</strong></li>
              <li><strong>Begära dataportabilitet</strong> — få ut dina uppgifter i ett strukturerat format.</li>
              <li><strong>Invända mot behandling</strong> som baseras på berättigat intresse.</li>
              <li><strong>Begränsa behandling</strong> medan en tvist utreds.</li>
              <li><strong>Återkalla samtycke</strong> när som helst (gäller framåt i tiden).</li>
              <li>
                <strong>Lämna in klagomål till Integritetsskyddsmyndigheten (IMY)</strong>{' '}
                — <a href="https://www.imy.se" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">imy.se</a>{' '}
                — om du anser att vi behandlar dina uppgifter felaktigt.
              </li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Skicka mejl till{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>{' '}
              så hanterar vi din begäran inom 30 dagar (GDPR-art. 12.3).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">12. Barnskydd</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar är inte avsedd för personer under 16 år. Vi samlar inte medvetet in
              personuppgifter från barn. Om du är vårdnadshavare och tror att ditt barn
              har lämnat uppgifter — kontakta oss så raderar vi dem.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">13. Säkerhet</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              All data lagras hos Supabase i EU (Irland) över krypterade anslutningar (TLS).
              Databastabeller med personuppgifter skyddas av Row Level Security (RLS) —
              de är inte direkt åtkomliga för webbläsaren, utan endast via serverside
              edge-funktioner som använder en intern nyckel som aldrig exponeras mot frontend.
              Endast den som driver tjänsten har åtkomst till databasen via Supabase-kontot.
              IP-adresser hashas med SHA-256 innan de lagras och kan inte återföras till
              en faktisk adress. Edge-funktioner har rate limiting, domain-allowlists och
              CORS-begränsningar för att skydda mot missbruk. Vi följer rimliga säkerhetsåtgärder
              men kan inte garantera 100 % säkerhet — vid en allvarlig incident informerar vi
              berörda inom 72 timmar enligt GDPR-art. 33.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">14. Ändringar i policyn</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vi kan uppdatera den här policyn när tjänsten utvecklas. Stora ändringar
              meddelar vi via en banner på startsidan. Datumet ovan visar senaste
              uppdatering.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Kontakt
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Frågor, klagomål, eller begäran om radering — skicka mejl till{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline font-medium">info@findcar.se</a>.
              Vi svarar normalt inom några arbetsdagar och behandlar formella GDPR-ärenden
              inom 30 dagar.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
