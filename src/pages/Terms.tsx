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
        <p className="text-sm text-muted-foreground">Senast uppdaterad: Februari 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">1. Tjänsten</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Find Car är en söktjänst som hjälper användare hitta bilar genom AI-driven matchning. Tjänsten är
            gratis att använda.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">2. Ansvar</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Find Car ansvarar inte för riktigheten i annonsdata. Verifiera alltid information direkt med
            säljaren.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">3. Användning</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Tjänsten får inte användas för automatiserad datainsamling eller i strid med gällande lagar.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">4. Ändringar</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi förbehåller oss rätten att ändra dessa villkor. Fortsatt användning innebär godkännande av
            uppdaterade villkor.
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
