import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { SEO } from '@/components/SEO';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home, Search } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error('404: route saknas:', location.pathname);
  }, [location.pathname]);

  const goSearch = () => {
    navigate('/');
    setTimeout(() => {
      document.querySelector('[data-search-section]')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Sidan hittades inte | FindCar"
        description="Sidan du letade efter finns inte. Hitta din nästa bil med FindCar istället."
        path={location.pathname}
        noindex
      />
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <p className="text-7xl md:text-8xl font-bold text-gradient leading-none">404</p>
            <h1 className="text-2xl md:text-3xl font-bold">Den här sidan hittades inte</h1>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
              Sidan du letade efter finns inte längre, eller så har länken blivit fel.
              Bilen du sökte kan också ha sålts och tagits bort från vår lista.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button asChild variant="gradient" size="lg" className="rounded-2xl">
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                Till startsidan
              </Link>
            </Button>
            <Button onClick={goSearch} variant="outline" size="lg" className="rounded-2xl">
              <Search className="h-4 w-4 mr-2" />
              Hitta en bil
            </Button>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tillbaka
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
