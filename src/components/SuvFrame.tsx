import { type ReactNode } from 'react';

/**
 * SuvFrame — wraps children (the chat) inside a subtle SUV silhouette.
 * The whole frame IS the SUV — the chat sits in the cabin/window area.
 * Decorative only (aria-hidden on the SVG).
 */
export const SuvFrame = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto">
      {/* SUV silhouette — full body wraps the chat. Chat sits as the cabin window. */}
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      >
        <defs>
          <linearGradient id="suvBodyStroke" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="suvShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.10" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* SUV body — large, wrapping the chat area */}
        <path
          d="
            M 30 510
            L 30 240
            Q 30 200 70 185
            L 170 150
            Q 210 70 290 55
            L 510 55
            Q 590 70 630 150
            L 730 185
            Q 770 200 770 240
            L 770 510
            Z
          "
          fill="url(#suvShadow)"
          stroke="url(#suvBodyStroke)"
          strokeWidth="2"
        />

        {/* Roof rail */}
        <line
          x1="290"
          y1="52"
          x2="510"
          y2="52"
          stroke="hsl(var(--secondary))"
          strokeOpacity="0.5"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Headlight (front-right) */}
        <ellipse cx="745" cy="225" rx="16" ry="7" fill="hsl(var(--secondary))" fillOpacity="0.45" />
        {/* Rear light (back-left) */}
        <ellipse cx="55" cy="225" rx="12" ry="6" fill="hsl(var(--primary))" fillOpacity="0.4" />

        {/* Door handle hints (sides of cabin) */}
        <line x1="80" y1="350" x2="120" y2="350" stroke="hsl(var(--secondary))" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />
        <line x1="680" y1="350" x2="720" y2="350" stroke="hsl(var(--secondary))" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round" />

        {/* Wheel arches */}
        <circle cx="180" cy="510" r="62" fill="none" stroke="hsl(var(--secondary))" strokeOpacity="0.4" strokeWidth="1.5" />
        <circle cx="620" cy="510" r="62" fill="none" stroke="hsl(var(--secondary))" strokeOpacity="0.4" strokeWidth="1.5" />
        {/* Wheels */}
        <circle cx="180" cy="510" r="44" fill="hsl(var(--background))" stroke="hsl(var(--secondary))" strokeOpacity="0.55" strokeWidth="2" />
        <circle cx="620" cy="510" r="44" fill="hsl(var(--background))" stroke="hsl(var(--secondary))" strokeOpacity="0.55" strokeWidth="2" />
        {/* Wheel hubs */}
        <circle cx="180" cy="510" r="14" fill="hsl(var(--secondary))" fillOpacity="0.4" />
        <circle cx="620" cy="510" r="14" fill="hsl(var(--secondary))" fillOpacity="0.4" />
        {/* Spokes */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={`fl-${deg}`} transform={`rotate(${deg} 180 510)`}>
            <line x1="180" y1="500" x2="180" y2="478" stroke="hsl(var(--secondary))" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <g key={`fr-${deg}`} transform={`rotate(${deg} 620 510)`}>
            <line x1="620" y1="500" x2="620" y2="478" stroke="hsl(var(--secondary))" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        ))}

        {/* Ground shadow */}
        <line
          x1="20"
          y1="565"
          x2="780"
          y2="565"
          stroke="hsl(var(--secondary))"
          strokeOpacity="0.18"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Chat — sits in the SUV cabin (with padding for body, roof and wheels) */}
      <div className="relative z-10 px-6 md:px-16 pt-14 md:pt-20 pb-20 md:pb-28">
        {children}
      </div>
    </div>
  );
};