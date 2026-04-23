import { motion } from 'framer-motion';

type Props = {
  /** Full headline rendered as editorial serif. Newlines split into separate lines. */
  lines: string[];
  /** Subtitle, rendered under the headline in sans. */
  subtitle: string;
  /** Tailwind text size classes for the headline */
  sizeClass: string;
  /** Tailwind text size classes for the subtitle */
  subtitleClass?: string;
};

/** Headline with word-by-word reveal. First line uses Instrument Serif italic
 *  as an editorial accent ("Din objektiva"), second line is serif regular.
 *  Falls back to static render under prefers-reduced-motion. */
export default function HeroHeadline({ lines, subtitle, sizeClass, subtitleClass = 'text-sm md:text-base' }: Props) {
  const reveal = {
    hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { delay: 0.08 * i + 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <div className="space-y-3">
      <h1 className="sr-only">FindCar — {lines.join(' ')}</h1>

      <div className={`font-serif leading-[1.02] tracking-tight text-white ${sizeClass}`}>
        {lines.map((line, lineIdx) => {
          const words = line.split(' ');
          const isAccentLine = lineIdx === 0;
          return (
            <div key={lineIdx} className="overflow-hidden">
              <div className="flex flex-wrap justify-center gap-x-[0.25em] gap-y-1">
                {words.map((word, wordIdx) => (
                  <motion.span
                    key={`${lineIdx}-${wordIdx}`}
                    custom={lineIdx * words.length + wordIdx}
                    variants={reveal}
                    initial="hidden"
                    animate="show"
                    className={isAccentLine ? 'italic text-white/95' : 'text-white'}
                    style={{ display: 'inline-block', willChange: 'transform, opacity, filter' }}
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`text-white/70 leading-relaxed max-w-md mx-auto ${subtitleClass}`}
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
