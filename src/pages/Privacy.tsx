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
        <p className="text-sm text-muted-foreground">Senast uppdaterad: Februari 2026</p>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">1. Insamling av data</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Find Car samlar in anonymiserad användningsdata för att förbättra tjänsten. Vi sparar inga
            personuppgifter utan ditt samtycke.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">2. Cookies</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi använder nödvändiga cookies för att tjänsten ska fungera korrekt, samt analytiska cookies för att
            förstå hur tjänsten används.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">3. Tredjeparter</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Vi delar inte dina uppgifter med tredjeparter i marknadsföringssyfte.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold">4. Kontakt</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            För frågor om integritet, kontakta oss på info@findcar.se.
          </p>
        </section>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
