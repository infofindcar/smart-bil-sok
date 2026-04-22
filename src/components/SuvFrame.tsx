import { type ReactNode } from 'react';
import suvImage from '@/assets/suv-frame.png';

/**
 * SuvFrame — wraps the chat inside a side-profile SUV illustration.
 * The chat is positioned exactly inside the SUV's window/cabin area.
 *
 * The background SUV image is 1920x1080. Window region (measured):
 *   x: 32% → 80%  (width 48%)
 *   y: 27% → 45%  (height 18%)
 */
export const SuvFrame = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative w-full max-w-5xl mx-auto">
      {/* SUV illustration as background — keeps native aspect 1920:1080 */}
      <div className="relative w-full" style={{ aspectRatio: '1920 / 1080' }}>
        <img
          src={suvImage}
          alt=""
          aria-hidden="true"
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />

        {/* Chat positioned inside the cabin window */}
        <div
          className="absolute"
          style={{
            left: '32%',
            right: '20%',
            top: '27%',
            bottom: '55%',
          }}
        >
          <div className="w-full h-full">{children}</div>
        </div>
      </div>
    </div>
  );
};