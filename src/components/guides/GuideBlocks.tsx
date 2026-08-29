import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { GuideBlock } from '@/content/guides';

/** Renderar **fet text** i en sträng utan att tillåta godtycklig HTML. */
export const RichText = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

/** Kontextuell sök-CTA mitt i brödtexten — startar Clutch med en förifylld fråga. */
const InlineSearchCta = ({ label, query }: { label: string; query: string }) => (
  <Link
    to={`/?q=${encodeURIComponent(query)}`}
    className="premium-card group not-prose flex items-center gap-3 rounded-2xl px-4 py-3.5 no-underline transition-colors hover:border-primary/40"
  >
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <Search className="h-4 w-4" />
    </span>
    <span className="text-sm font-medium text-foreground">
      {label}
      <span className="ml-1.5 inline-block text-primary transition-transform group-hover:translate-x-0.5">→</span>
    </span>
  </Link>
);

export const GuideBlocks = ({ blocks }: { blocks: GuideBlock[] }) => (
  <>
    {blocks.map((block, i) => {
      switch (block.type) {
        case 'h2':
          return (
            <h2 key={i} className="text-xl md:text-2xl font-bold text-foreground pt-4 scroll-mt-24">
              {block.text}
            </h2>
          );
        case 'p':
          return (
            <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
              <RichText text={block.text} />
            </p>
          );
        case 'ul':
          return (
            <ul key={i} className="list-disc list-outside space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
              {block.items.map((item, j) => (
                <li key={j}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          );
        case 'ol':
          return (
            <ol key={i} className="list-decimal list-outside space-y-2 pl-5 text-[15px] leading-relaxed text-muted-foreground">
              {block.items.map((item, j) => (
                <li key={j}>
                  <RichText text={item} />
                </li>
              ))}
            </ol>
          );
        case 'search':
          return <InlineSearchCta key={i} label={block.label} query={block.query} />;
        default:
          return null;
      }
    })}
  </>
);
