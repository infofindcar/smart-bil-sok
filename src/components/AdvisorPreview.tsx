import { TrendingUp, ShieldCheck, Wallet } from 'lucide-react';

const examples = [
  {
    make: 'Volvo',
    model: 'XC40',
    blurb: 'Trygg, rymlig SUV — populär bland familjer.',
    match: 94,
    monthly: '3 200 kr/mån',
    risk: 'Låg',
    value: 'God',
  },
  {
    make: 'Toyota',
    model: 'Corolla',
    blurb: 'Pålitlig hybrid med extremt låg driftkostnad.',
    match: 91,
    monthly: '2 400 kr/mån',
    risk: 'Mycket låg',
    value: 'Mycket god',
  },
  {
    make: 'Volkswagen',
    model: 'Golf',
    blurb: 'Allroundbil med jämn marknad och låg värdeminskning.',
    match: 88,
    monthly: '2 700 kr/mån',
    risk: 'Låg',
    value: 'God',
  },
];

export const AdvisorPreview = () => {
  return (
    <div className="mt-10 md:mt-14">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Exempel på rekommendationer
        </p>
        <span className="text-xs text-muted-foreground hidden sm:inline">Visas direkt efter sökning</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {examples.map((c) => (
          <article
            key={c.model}
            className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 transition-colors hover:border-foreground/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{c.make}</p>
                <h3 className="text-lg font-semibold text-foreground mt-0.5">{c.model}</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">Matchning</p>
                <p className="text-xl font-semibold text-primary tabular-nums leading-none mt-1">{c.match}%</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{c.blurb}</p>
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
              <Stat icon={<Wallet className="h-3.5 w-3.5" />} label="Mån.kostnad" value={c.monthly} />
              <Stat icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Risk" value={c.risk} />
              <Stat icon={<TrendingUp className="h-3.5 w-3.5" />} label="Prisvärt" value={c.value} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div>
    <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
      {icon}
      {label}
    </div>
    <p className="text-[13px] font-medium text-foreground mt-1 leading-tight">{value}</p>
  </div>
);