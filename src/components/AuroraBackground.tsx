import type { ReactNode } from 'react';

export const AuroraBackground = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Aurora effekt på desktop — på mobil håller vi det rent och avskalat */}
      <div className="aurora-bg hidden md:block" aria-hidden="true">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-grain" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
