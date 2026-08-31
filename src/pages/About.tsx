import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { ScrollReveal } from '@/components/ScrollReveal';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Flag,
  GraduationCap,
  Instagram,
  Mail,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import gokart from '@/assets/founders-gokart.webp';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.85-2.48V9.77a5.86 5.86 0 1 0 4.94 5.79V8.9a7.32 7.32 0 0 0 4.28 1.38V7.19a4.29 4.29 0 0 1-3.22-1.37z" />
  </svg>
);

const founders = [
  { name: 'Kim Nygren', role: 'Grundare — KTH', initials: 'KN' },
  { name: 'Marko Novacic', role: 'Grundare — KTH', initials: 'MN' },
];

const howItWorks = [
  {
    icon: MessageSquare,
    title: 'Du berättar vad du behöver',
    text: 'I vanlig svenska, precis som du skulle sagt det till en kompis som kan bilar.',
  },
  {
    icon: Search,
    title: 'Clutch söker åt dig',
    text: 'Vår AI tolkar vad du faktiskt menar och går igenom tusentals annonser.',
  },
  {
    icon: Star,
    title: 'Du får matchningar med förklaring',
    text: 'Varje bil kommer med ett betyg och varför just den passar dig.',
  },
  {
    icon: Wallet,
    title: 'Du ser vad bilen kostar att äga',
    text: 'Uppskattad månadskostnad — inte bara prislappen i annonsen.',
  },
];

const About = () => {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'Om FindCar',
      url: 'https://findcar.se/om-oss',
      description:
        'FindCar är byggt av två bilintresserade KTH-studenter som ville skapa en bilrådgivare utan säljmotiv.',
      isPartOf: { '@type': 'WebSite', name: 'FindCar', url: 'https://findcar.se' },
      about: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'FindCar',
        url: 'https://findcar.se',
        email: 'info@findcar.se',
        founder: founders.map((f) => ({ '@type': 'Person', name: f.name })),
        sameAs: [
          'https://instagram.com/findcar.se',
          'https://tiktok.com/@findcar.se',
          'https://linkedin.com/company/findcar-se',
        ],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://findcar.se/' },
        { '@type': 'ListItem', position: 2, name: 'Om oss', item: 'https://findcar.se/om-oss' },
      ],
    },
  ];

  return (
    <div className="min-h-screen premium-page-bg">
      <SEO
        title="Om oss — bilnördarna bakom FindCar"
        description="FindCar byggs av Kim och Marko, två bilintresserade KTH-studenter i KTH Launch. Vi ville ha en bilrådgivare utan säljmotiv — så vi byggde den. Helt gratis."
        path="/om-oss"
        image={`https://findcar.se${gokart}`}
        jsonLd={jsonLd}
      />
      <Header />

      <main className="pt-24 md:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-16 md:space-y-24">
          {/* Hero */}
          <section className="grid gap-8 md:gap-12 md:grid-cols-2 md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Flag className="h-3.5 w-3.5 text-primary" />
                Om oss
              </div>
              <h1 className="mt-4 text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight leading-[1.1] text-foreground">
                Två bilnördar från KTH som tröttnade på att bilköp var ett lotteri
              </h1>
              <p className="mt-5 text-[15px] md:text-base leading-relaxed text-muted-foreground">
                Vi är Kim och Marko. Vi byggde FindCar för att vi själva ville ha en bilrådgivare
                som inte hade något att sälja.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 shadow-lg">
              <img
                src={gokart}
                alt="FindCars grundare skakar hand i depån före ett gokart-race"
                loading="eager"
                className="w-full h-full object-cover aspect-[3/4] md:aspect-[4/5]"
              />
            </div>
          </section>

          {/* Varför FindCar finns */}
          <ScrollReveal>
            <section className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Varför FindCar finns
              </h2>
              <div className="mt-5 space-y-4 text-[15px] md:text-base leading-relaxed text-muted-foreground">
                <p>
                  Bilmarknaden har inte hängt med i den digitala utvecklingen. Folk lägger enorma
                  mängder tid på att leta — och pengar på att köpa fel bil.
                </p>
                <p>
                  Och den expertis man verkligen behöver när man handlar bil sitter oftast hos
                  någon vars jobb är att sälja dig en bil, vilket gör att informationen nästan
                  alltid blir partisk.
                </p>
                <p className="text-foreground font-medium">
                  Det var precis det vi ville ändra på: samma kunskap, men utan säljmotiv.
                </p>
              </div>
            </section>
          </ScrollReveal>

          {/* Bilintresset */}
          <ScrollReveal>
            <section className="rounded-2xl border border-border/60 bg-card/50 p-6 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Bilintresset kom först
              </h2>
              <div className="mt-5 space-y-4 text-[15px] md:text-base leading-relaxed text-muted-foreground max-w-2xl">
                <p>
                  Bilar har funnits med hela livet: alla bilshower, varje YouTube-video, alla
                  bilspel — vi kan varje kurva på Nürburgring utantill.
                </p>
                <p>
                  Vi kör gokart tillsammans så ofta vi kan, och när vi valde vad vi skulle satsa
                  på blev det självklart branschen vi älskar.
                </p>
              </div>
            </section>
          </ScrollReveal>

          {/* Sociala medier */}
          <ScrollReveal>
            <section className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Vi lever bilcontent
              </h2>
              <p className="mt-5 text-[15px] md:text-base leading-relaxed text-muted-foreground">
                Vi kör runt i olika bilar, filmar och delar det på sociala medier. Det är samma
                intresse som driver FindCar — ingen marknadsavdelning, bara vi två som tycker att
                bilar är kul.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="https://instagram.com/findcar.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-colors"
                >
                  <Instagram className="h-4 w-4 text-primary" />
                  Följ oss på Instagram
                </a>
                <a
                  href="https://tiktok.com/@findcar.se"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-card transition-colors"
                >
                  <TikTokIcon className="h-4 w-4 text-primary" />
                  Följ oss på TikTok
                </a>
              </div>
            </section>
          </ScrollReveal>

          {/* KTH */}
          <ScrollReveal>
            <section className="grid gap-6 md:grid-cols-[auto,1fr] md:gap-8 rounded-2xl border border-border/60 bg-card/50 p-6 md:p-10">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  KTH och KTH Launch
                </h2>
                <p className="mt-4 text-[15px] md:text-base leading-relaxed text-muted-foreground max-w-2xl">
                  FindCar byggs av två studenter på KTH och är en del av KTH Launch, ett selektivt
                  entreprenörsprogram. Kombinationen ger oss det tekniska kunnandet att faktiskt
                  bygga produkten själva — och strukturen att bygga ett bolag av den.
                </p>
              </div>
            </section>
          </ScrollReveal>

          {/* Vad FindCar gör */}
          <ScrollReveal>
            <section>
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Så gör vi det
                </div>
                <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Vad FindCar faktiskt gör
                </h2>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {howItWorks.map((step) => (
                  <div
                    key={step.title}
                    className="rounded-2xl border border-border/60 bg-card/50 p-5 md:p-6"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                FindCar är helt gratis att använda.
              </div>
            </section>
          </ScrollReveal>

          {/* Team */}
          <ScrollReveal>
            <section>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Vi som bygger FindCar
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {founders.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-4 rounded-2xl border border-border/60 bg-card/50 p-5 md:p-6"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {f.initials}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{f.name}</p>
                      <p className="text-sm text-muted-foreground">{f.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal>
            <section className="rounded-2xl border border-border/60 bg-card/60 p-6 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Redo att hitta din bil?
              </h2>
              <p className="mt-3 text-[15px] md:text-base leading-relaxed text-muted-foreground max-w-xl mx-auto">
                Beskriv vad du letar efter — Clutch gör resten. Har du frågor eller idéer hör vi
                gärna av dig.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link to="/">
                    Hitta din bil
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="mailto:info@findcar.se">
                    <Mail className="h-4 w-4 mr-2" />
                    info@findcar.se
                  </a>
                </Button>
              </div>
            </section>
          </ScrollReveal>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
