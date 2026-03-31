import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
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
        <h1 className="text-3xl font-bold">Användarvillkor</h1>
        <p className="text-sm text-muted-foreground">Senast uppdaterad: Mars 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">1. Tjänsten</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Find Car hjälper dig hitta bilar genom AI-baserade rekommendationer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">2. Rekommendationer</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Rekommendationerna är baserade på data och ska ses som vägledning, inte garanti.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">3. Ansvar</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Du ansvarar själv för att kontrollera information innan du fattar ett beslut.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">4. Tredjepart</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi kan visa innehåll från andra sidor och ansvarar inte för det.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">5. Användning</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Tjänsten får inte missbrukas eller användas för olagliga ändamål.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">6. Ändringar</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi kan uppdatera villkoren över tid.
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

export default Terms;
