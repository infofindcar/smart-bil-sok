import { Link, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { GuideBlocks } from '@/components/guides/GuideBlocks';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, ArrowRight, Clock, CalendarDays, Search } from 'lucide-react';
import { getGuideBySlug, getRelatedGuides } from '@/content/guides';
import NotFound from './NotFound';

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

const GuideArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = getGuideBySlug(slug);

  if (!guide) return <NotFound />;

  const url = `https://findcar.se/guider/${guide.slug}`;
  const related = getRelatedGuides(guide);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.metaDescription,
      dateModified: guide.updated,
      inLanguage: 'sv-SE',
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Organization', name: 'FindCar', url: 'https://findcar.se' },
      publisher: { '@type': 'Organization', name: 'FindCar', url: 'https://findcar.se' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://findcar.se/' },
        { '@type': 'ListItem', position: 2, name: 'Guider', item: 'https://findcar.se/guider' },
        { '@type': 'ListItem', position: 3, name: guide.title, item: url },
      ],
    },
  ];

  const SearchCta = ({ heading }: { heading: string }) => (
    <div className="premium-card not-prose rounded-2xl p-5 md:p-6">
      <h2 className="text-base md:text-lg font-semibold text-foreground">{heading}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Beskriv din situation i egna ord — Clutch går igenom tusentals annonser och föreslår bilar
        som faktiskt passar dig. Gratis, utan provision.
      </p>
      <Link
        to="/"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Search className="h-4 w-4" />
        Sök här
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen premium-page-bg">
      <SEO
        title={guide.metaTitle}
        description={guide.metaDescription}
        path={`/guider/${guide.slug}`}
        type="article"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <article className="max-w-2xl mx-auto">
          {/* Brödsmula */}
          <nav aria-label="Brödsmulor" className="text-xs text-muted-foreground/80">
            <Link to="/guider" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Alla guider
            </Link>
          </nav>

          <header className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {guide.category}
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight leading-[1.15] text-foreground">
              {guide.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {guide.readingMinutes} min läsning
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Senast uppdaterad {formatDate(guide.updated)}
              </span>
            </div>
          </header>

          {/* Direktsvar */}
          <div className="mt-7 rounded-2xl border-l-4 border-primary bg-primary/5 px-5 py-4">
            <p className="text-[15px] md:text-base font-medium leading-relaxed text-foreground">
              {guide.answer}
            </p>
          </div>

          {/* CTA direkt under ingressen */}
          <div className="mt-6">
            <SearchCta heading="Redo att hitta din bil?" />
          </div>

          {/* Brödtext */}
          <div className="mt-10 space-y-4">
            <GuideBlocks blocks={guide.blocks} />
          </div>

          {/* FAQ */}
          <section className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">Vanliga frågor</h2>
            <Accordion type="single" collapsible className="mt-4">
              {guide.faq.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-[15px] font-medium">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* CTA efter FAQ */}
          <div className="mt-10">
            <SearchCta heading="Vill du se bilar som passar dig?" />
          </div>

          {/* Läs även */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Läs även
              </h2>
              <div className="mt-4 space-y-3">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    to={`/guider/${item.slug}`}
                    className="premium-card group flex items-center justify-between gap-4 rounded-2xl px-5 py-4 transition-colors hover:border-primary/40"
                  >
                    <span>
                      <span className="block text-[15px] font-medium text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.readingMinutes} min läsning
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default GuideArticle;
