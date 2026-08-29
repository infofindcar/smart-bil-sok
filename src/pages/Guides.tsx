import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import { guideCategories, getGuidesByCategory, guides } from '@/content/guides';

const Guides = () => {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Guider för dig som ska köpa bil',
      description:
        'Objektiva guider om begagnade bilar: pris, besiktning, värdeminskning, finansiering och praktiska checklistor.',
      url: 'https://findcar.se/guider',
      isPartOf: { '@type': 'WebSite', name: 'FindCar', url: 'https://findcar.se' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: guides.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: g.title,
        url: `https://findcar.se/guider/${g.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://findcar.se/' },
        { '@type': 'ListItem', position: 2, name: 'Guider', item: 'https://findcar.se/guider' },
      ],
    },
  ];

  return (
    <div className="min-h-screen premium-page-bg">
      <SEO
        title="Guider för dig som ska köpa bil | FindCar"
        description="Objektiva guider om begagnade bilar: så bedömer du pris, läser besiktningsprotokoll, jämför el och bensin och väljer finansiering. Gratis och utan säljtryck."
        path="/guider"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Intro */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Kunskapsbank
            </div>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Guider för dig som ska köpa bil
            </h1>
            <p className="mt-4 text-[15px] md:text-base leading-relaxed text-muted-foreground">
              Här samlar vi kunskap och praktiska guider för dig som ska köpa bil. Vi säljer inte
              bilar och tar ingen provision — allt du läser här är skrivet för att du ska fatta ett
              bättre beslut, oavsett var du sedan köper bilen.
            </p>
          </div>

          {/* Kategorier */}
          <div className="mt-12 space-y-14">
            {guideCategories.map((category) => {
              const categoryGuides = getGuidesByCategory(category);
              if (categoryGuides.length === 0) return null;
              return (
                <section key={category}>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                    {category}
                  </h2>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {categoryGuides.map((guide) => (
                      <Link
                        key={guide.slug}
                        to={`/guider/${guide.slug}`}
                        className="premium-card group flex flex-col rounded-2xl p-5 transition-colors hover:border-primary/40"
                      >
                        <h3 className="text-lg font-semibold leading-snug text-foreground">
                          {guide.title}
                        </h3>
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                          {guide.excerpt}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/80">
                            <Clock className="h-3.5 w-3.5" />
                            {guide.readingMinutes} min läsning
                          </span>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                            Läs mer
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Avslutande CTA */}
          <div className="premium-card mt-14 rounded-2xl p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Redo att hitta din bil?</h2>
            <p className="mt-2 text-sm md:text-[15px] leading-relaxed text-muted-foreground">
              Beskriv din situation i egna ord — Clutch går igenom tusentals annonser och föreslår
              bilar som faktiskt passar dig. Helt gratis, utan provision.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Sök bil
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Guides;
