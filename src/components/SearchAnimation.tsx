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
    <div className="flex flex-col items-center justify-center py-10 space-y-6">
      {/* Animated rings */}
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
        {/* Middle ring */}
        <div
          className="absolute inset-2 rounded-full border-2 border-primary/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
          style={{ animationDelay: '0.4s' }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-4 rounded-full border-2 border-primary/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"
          style={{ animationDelay: '0.8s' }}
        />
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <Sparkles className="h-5 w-5 text-primary-foreground animate-pulse" />
          </div>
        </div>
      </div>

      {/* Animated dots bar */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            style={{
              animation: 'bounce 1s ease-in-out infinite',
              animationDelay: `${i * 0.12}s`,
              opacity: 0.3 + (i * 0.15),
            }}
          />
        ))}
      </div>

      {/* Rotating message */}
      <p
        className="text-sm text-muted-foreground font-medium transition-opacity duration-500"
        key={messageIndex}
        style={{ animation: 'fade-in 0.5s ease-out' }}
      >
        {MESSAGES[messageIndex]}
      </p>
    </div>
  );
};
