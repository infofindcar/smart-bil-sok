import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  const navigate = useNavigate();
  return (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Tillbaka
        </Button>
        <h1 className="text-3xl font-bold">Integritetspolicy</h1>
        <p className="text-sm text-muted-foreground">Senast uppdaterad: Mars 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">1. Data vi samlar in</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi samlar in viss information när du använder tjänsten, t.ex.:
          </p>
          <ul className="list-disc list-inside text-muted-foreground text-sm leading-relaxed space-y-1 pl-2">
            <li>Dina val och preferenser</li>
            <li>Teknisk information (enhet, webbläsare)</li>
            <li>Hur du använder tjänsten</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">2. Hur vi använder data</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi använder datan för att:
          </p>
          <ul className="list-disc list-inside text-muted-foreground text-sm leading-relaxed space-y-1 pl-2">
            <li>Förbättra tjänsten</li>
            <li>Ge bättre rekommendationer</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">3. AI och rekommendationer</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Find Car använder AI för att matcha dig med relevanta bilar baserat på dina svar.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">4. Delning av data</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi säljer inte din data. Vi kan använda tredjepartstjänster för drift och analys.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">5. Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi använder cookies för att få tjänsten att fungera och förstå hur den används.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">6. Dina rättigheter</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Du kan kontakta oss om du vill få din data raderad eller har frågor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">7. Kontakt</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            För frågor, kontakta oss på <a href="mailto:info@findcar.se" className="text-primary hover:underline">info@findcar.se</a>.
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
  );
};

export default Privacy;
