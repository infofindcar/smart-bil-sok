import { type ReactNode } from 'react';

/**
 * SuvFrame — wraps children (the chat) inside a subtle SUV silhouette.
 * The chat sits where the SUV's window/cabin would be.
 * Decorative only (aria-hidden on the SVG).
 */
export const SuvFrame = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto pt-6 md:pt-10 pb-10 md:pb-14 px-4 md:px-10">
      {/* SUV silhouette — sits behind the chat */}
      <svg
        viewBox="0 0 800 520"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          <linearGradient id="suvBodyStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="suvShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Soft body fill */}
        <path
          d="
            M 60 380
            L 60 320
            Q 60 280 100 270
            L 180 250
            Q 210 200 260 180
            L 360 150
            Q 420 135 500 145
            L 600 165
            Q 660 180 700 230
            L 740 270
            Q 760 280 760 320
            L 760 380
            Z
          "
          fill="url(#suvShadow)"
          stroke="url(#suvBodyStroke)"
          strokeWidth="1.5"
        />

        {/* Roof rails / antenna hint */}
        <line
          x1="280"
          y1="148"
          x2="540"
          y2="143"
          stroke="hsl(var(--secondary))"
          strokeOpacity="0.4"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Front headlight */}
        <ellipse cx="725" cy="305" rx="14" ry="6" fill="hsl(var(--secondary))" fillOpacity="0.35" />
        {/* Rear light */}
        <ellipse cx="78" cy="305" rx="10" ry="5" fill="hsl(var(--primary))" fillOpacity="0.3" />

        {/* Wheel arches */}
        <circle cx="200" cy="385" r="48" fill="none" stroke="hsl(var(--secondary))" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="600" cy="385" r="48" fill="none" stroke="hsl(var(--secondary))" strokeOpacity="0.4" strokeWidth="1.5" />
        {/* Wheels */}
        <circle cx="200" cy="385" r="32" fill="hsl(var(--background))" stroke="hsl(var(--secondary))" strokeOpacity="0.5" strokeWidth="1.5" />
        <circle cx="600" cy="385" r="32" fill="hsl(var(--background))" stroke="hsl(var(--secondary))" strokeOpacity="0.5" strokeWidth="1.5" />
        <circle cx="200" cy="385" r="10" fill="hsl(var(--secondary))" fillOpacity="0.35" />
        <circle cx="600" cy="385" r="10" fill="hsl(var(--secondary))" fillOpacity="0.35" />

        {/* Ground line */}
        <line
          x1="40"
          y1="430"
          x2="760"
          y2="430"
          stroke="hsl(var(--secondary))"
          strokeOpacity="0.15"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Chat — positioned as the SUV's cabin/window */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};