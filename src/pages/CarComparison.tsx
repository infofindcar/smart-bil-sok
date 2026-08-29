import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Car } from '@/components/GuidedSearch';
import { SEO } from '@/components/SEO';

const formatPrice = (price: number | null) => {
  if (!price) return '–';
  return new Intl.NumberFormat('sv-SE').format(price) + ' kr';
};

const CarComparison = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const cars: Car[] = (location.state as any)?.cars || [];

  if (cars.length < 2) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Jämför bilar | FindCar"
          description="Jämför dina sparade bilar sida vid sida — pris, årsmodell, miltal och utrustning."
          path="/compare"
        />
        <Header />
        <div className="flex flex-col items-center justify-center py-32 gap-4 px-4 text-center">
          <h1 className="text-3xl font-bold">Jämför bilar</h1>
          <p className="text-muted-foreground">Spara minst 2 bilar för att jämföra.</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
      </div>
    );
  }

  const specs: { label: string; getValue: (car: Car) => string }[] = [
    { label: 'Pris', getValue: (c) => formatPrice(c.price) },
    { label: 'Årsmodell', getValue: (c) => String(c.year || '–') },
    {
      label: 'Miltal',
      getValue: (c) => (c.mileage ? `${new Intl.NumberFormat('sv-SE').format(c.mileage)} mil` : '–'),
    },
    { label: 'Bränsle', getValue: (c) => c.fuel_type || '–' },
    { label: 'Kaross', getValue: (c) => c.body_type || '–' },
    { label: 'Drivlina', getValue: (c) => (c.drivetrain && c.drivetrain !== 'Unknown' && c.drivetrain !== 'Okänd') ? c.drivetrain : '–' },
    { label: 'Färg', getValue: (c) => c.color || '–' },
    { label: 'Stad', getValue: (c) => c.city || '–' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Jämför bilar | FindCar"
        description="Jämför dina sparade bilar sida vid sida — pris, årsmodell, miltal och utrustning."
        path="/compare"
      />
      <Header />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <h1 className="text-3xl font-bold mb-8">Jämför bilar</h1>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-3 text-sm text-muted-foreground font-medium min-w-[120px]" />
                  {cars.map((car) => (
                    <th key={car.id} className="p-3 text-center min-w-[180px]">
                      <div className="space-y-2">
                        {car.image_thumb_url && (
                          <img
                            src={car.image_thumb_url}
                            alt=""
                            className="w-full h-28 object-cover rounded-lg"
                          />
                        )}
                        <p className="font-semibold text-sm">
                          {car.make} {car.model}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec.label} className="border-t border-border">
                    <td className="p-3 text-sm text-muted-foreground font-medium">{spec.label}</td>
                    {cars.map((car) => (
                      <td key={car.id} className="p-3 text-center text-sm font-medium">
                        {spec.getValue(car)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CarComparison;
