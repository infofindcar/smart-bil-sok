import type { ReactNode } from 'react';

export const AuroraBackground = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="aurora-bg" aria-hidden="true">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-grain" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
