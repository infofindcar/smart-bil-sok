import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const MESSAGES = [
  'Söker bland hundratals bilar...',
  'Analyserar dina preferenser...',
  'Hittar de bästa matcherna...',
  'Nästan klart...',
];

export const SearchAnimation = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-5">
      {/* Pulsing avatar with rings */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border border-primary/15 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div
          className="absolute inset-3 rounded-full border border-primary/25 animate-[ping_2.4s_cubic-bezier(0,0,0.2,1)_infinite]"
          style={{ animationDelay: '0.5s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="clutch-avatar w-14 h-14 rounded-full flex items-center justify-center avatar-thinking">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
        </div>
      </div>

      {/* Wave indicator */}
      <div className="flex items-end gap-1.5 h-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="wave-dot"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>

      {/* Rotating message */}
      <p
        className="text-sm text-muted-foreground font-medium tracking-tight"
        key={messageIndex}
        style={{ animation: 'fade-in 0.5s ease-out' }}
      >
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
};
