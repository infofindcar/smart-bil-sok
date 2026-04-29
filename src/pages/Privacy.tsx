import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail } from 'lucide-react';

const Privacy = () => {
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
            <h1 className="text-3xl font-bold">Integritetspolicy</h1>
            <p className="text-sm text-muted-foreground mt-2">Senast uppdaterad: April 2026</p>
            <p className="text-sm leading-relaxed mt-4">
              FindCar (findcar.se) hjälper privatpersoner att hitta rätt bil med hjälp av AI.
              Vi tar din integritet på allvar och följer dataskyddsförordningen (GDPR). Den här
              policyn beskriver vilka uppgifter vi samlar in, varför, hur länge, och vilka
              rättigheter du har.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">1. Vem är personuppgiftsansvarig</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar drivs av en privatperson som hobby- och utvecklingsprojekt. Vi är inte ett
              registrerat företag. Kontakt för alla integritetsfrågor:{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">2. Vilka uppgifter vi samlar in</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">När du använder FindCar samlar vi in följande:</p>
            <div className="space-y-3 text-sm leading-relaxed">
              <div>
                <strong className="text-foreground">Kontaktuppgifter (när du fyller i kontaktformulär):</strong>
                <p className="text-muted-foreground mt-1">Namn, e-postadress, telefonnummer och meddelande som du frivilligt lämnar för att kontakta en bilförsäljare.</p>
              </div>
              <div>
                <strong className="text-foreground">Konversation med Clutch (vår AI-rådgivare):</strong>
                <p className="text-muted-foreground mt-1">
                  Det du skriver i AI-chatten — t.ex. vilken typ av bil du vill ha, var du bor, budget, livssituation. Sparas
                  endast tillfälligt i din webbläsare (sessionStorage) och raderas automatiskt när du stänger fliken. Vi sparar inte konversationen permanent.
                </p>
              </div>
              <div>
                <strong className="text-foreground">Sparade bilar och preferenser:</strong>
                <p className="text-muted-foreground mt-1">
                  Bilar du markerar som favoriter sparas lokalt i din webbläsare. Lämnar aldrig din enhet.
                </p>
              </div>
              <div>
                <strong className="text-foreground">Teknisk information:</strong>
                <p className="text-muted-foreground mt-1">
                  IP-adress, webbläsare, enhetstyp, vilka sidor du besöker och hur du klickar. Används för felsökning och anonym
                  statistik om hur tjänsten fungerar. Loggas automatiskt av vår plattform (Supabase, EU-baserad).
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">3. Hur vi använder uppgifterna</h2>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li>Att leverera Clutch-rekommendationer som matchar dina preferenser.</li>
              <li>Att förmedla din kontaktförfrågan till bilförsäljaren du valt (se punkt 4).</li>
              <li>Att förbättra tjänsten — anonym statistik om vad som söks och vad som fungerar bra.</li>
              <li>Att förebygga missbruk och tekniska fel.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">4. Delning med tredje part</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">När du fyller i kontaktformuläret för en bil:</strong> dina kontaktuppgifter och meddelandet skickas via e-post till
              den bilförsäljare som annonserar bilen, så att de kan kontakta dig. Försäljaren hanterar därefter
              uppgifterna enligt sin egen integritetspolicy. Vi säljer aldrig din data och delar den inte i
              något annat sammanhang.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">Tjänsteleverantörer vi använder:</strong>
            </p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1 pl-5">
              <li><strong>Supabase</strong> (EU/Irland) — databas, autentisering, edge functions.</li>
              <li><strong>Lovable AI Gateway / Google Gemini</strong> — AI-modell som driver Clutch-rådgivaren.</li>
              <li><strong>Resend</strong> — e-postutskick av kontaktförfrågningar till säljare.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">5. Var bilannonserna kommer ifrån</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              FindCar är en oberoende sökmotor som visar bilannonser hämtade från offentliga källor på internet.
              Vi visar bara information som redan är offentligt tillgänglig — pris, modell, mil, säljarnamn,
              kontaktuppgifter till bilfirmor osv. Vi har ingen direkt affärsrelation med säljarna.
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              <strong className="text-foreground">Är du bilfirma och vill inte synas på FindCar?</strong>{' '}
              Skicka ett mejl till{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>{' '}
              med ditt firmanamn och organisationsnummer, så tar vi bort era annonser inom 7 dagar och
              ser till att de inte återimporteras.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">6. Hur länge vi sparar data</h2>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Clutch-konversationer:</strong> raderas automatiskt när du stänger webbläsarfliken.</li>
              <li><strong>Kontaktförfrågningar (leads):</strong> sparas tillsvidare för att kunna besvara
                eventuella följdfrågor från dig eller säljaren. Du kan när som helst begära radering — se punkt 8.</li>
              <li><strong>Anonym användarstatistik:</strong> 12 månader, sedan raderas eller anonymiseras.</li>
              <li><strong>Tekniska loggar:</strong> 30 dagar, sedan rensas automatiskt.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">7. Cookies och liknande tekniker</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Vi använder följande:</p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Nödvändiga cookies:</strong> får tjänsten att fungera (t.ex. komma ihåg att du
                klickat OK på cookie-banner). Krävs ingen samtycke.</li>
              <li><strong>SessionStorage:</strong> Clutch-konversationen och dina sparade favoriter ligger
                i din webbläsare och lämnar aldrig din enhet.</li>
              <li><strong>Anonym statistik:</strong> vi mäter klick och visningar internt utan att kunna
                koppla det till dig som person.</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Vi använder <strong>inte</strong> Google Analytics, Meta Pixel eller andra externa spårningsverktyg.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">8. Dina rättigheter enligt GDPR</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">Du har rätt att:</p>
            <ul className="list-disc list-outside text-muted-foreground text-sm leading-relaxed space-y-1.5 pl-5">
              <li><strong>Få veta</strong> vilka uppgifter vi har om dig.</li>
              <li><strong>Få dina uppgifter raderade</strong> ("rätten att bli glömd").</li>
              <li><strong>Rätta felaktiga uppgifter.</strong></li>
              <li><strong>Begära dataportabilitet</strong> — få ut dina uppgifter i ett strukturerat format.</li>
              <li><strong>Invända mot behandling</strong> som baseras på berättigat intresse.</li>
              <li><strong>Lämna in klagomål till Integritetsskyddsmyndigheten (IMY)</strong> om du anser att vi behandlar dina uppgifter felaktigt.</li>
            </ul>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Skicka mejl till{' '}
              <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>{' '}
              så hanterar vi din begäran inom 30 dagar.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">9. Säkerhet</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              All data lagras hos Supabase i EU (Irland) över krypterade anslutningar (TLS).
              Endast den som driver tjänsten har åtkomst till databasen. Vi följer rimliga
              säkerhetsåtgärder men kan inte garantera 100 % säkerhet — om en incident
              skulle inträffa informerar vi dig så snabbt vi kan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">10. Ändringar i policyn</h2>
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
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
