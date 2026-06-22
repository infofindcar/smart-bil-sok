import { memo } from 'react';

/**
 * Subtle navigation/road-inspired line motif drifting in the background.
 * Pure SVG, GPU-friendly transform animation, very low opacity.
 * Pauses for users who prefer reduced motion (handled globally in index.css).
 */
export const RoadLines = memo(() => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden"
  >
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 600"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="road-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="url(#road-fade)" strokeWidth="1" fill="none" className="road-lines-drift">
        <path d="M0,140 C300,80 700,200 1200,120" />
        <path d="M0,300 C400,260 800,360 1200,300" opacity="0.7" />
        <path d="M0,460 C300,520 800,420 1200,500" opacity="0.5" />
      </g>
    </svg>
  </div>
));

RoadLines.displayName = 'RoadLines';