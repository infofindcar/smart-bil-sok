import { useRef, useEffect, useCallback, useState } from 'react';
import heroVideo from '@/assets/hero-video.mp4';

interface VideoLoopProps {
  scrollProgress: number;
}

export const VideoLoop = ({ scrollProgress }: VideoLoopProps) => {
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const [activeVideo, setActiveVideo] = useState<'A' | 'B'>('A');
  const crossfadingRef = useRef(false);
  const CROSSFADE_START = 1.2; // seconds before end to start crossfade
  const CROSSFADE_DURATION = 1000; // ms for CSS transition

  const getActiveRef = useCallback(() => {
    return activeVideo === 'A' ? videoARef : videoBRef;
  }, [activeVideo]);

  const getInactiveRef = useCallback(() => {
    return activeVideo === 'A' ? videoBRef : videoARef;
  }, [activeVideo]);

  useEffect(() => {
    const activeEl = getActiveRef().current;
    const inactiveEl = getInactiveRef().current;
    if (!activeEl || !inactiveEl) return;

    // Ensure active video is playing
    activeEl.play().catch(() => {});

    const handleTimeUpdate = () => {
      if (crossfadingRef.current) return;
      if (!activeEl.duration) return;

      const timeLeft = activeEl.duration - activeEl.currentTime;
      if (timeLeft <= CROSSFADE_START) {
        crossfadingRef.current = true;

        // Prepare inactive video from the start
        inactiveEl.currentTime = 0;
        inactiveEl.play().catch(() => {});

        // After CSS transition completes, swap roles
        setTimeout(() => {
          setActiveVideo((prev) => (prev === 'A' ? 'B' : 'A'));
          crossfadingRef.current = false;
          // Pause the old video to save resources
          activeEl.pause();
        }, CROSSFADE_DURATION);
      }
    };

    activeEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      activeEl.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [activeVideo, getActiveRef, getInactiveRef]);

  const baseStyle = {
    opacity: 1 - scrollProgress * 0.3,
  };

  return (
    <>
      <video
        ref={videoARef}
        autoPlay={activeVideo === 'A'}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
        style={{
          ...baseStyle,
          opacity: activeVideo === 'A' || crossfadingRef.current === false
            ? baseStyle.opacity
            : 0,
          zIndex: activeVideo === 'A' ? 2 : 1,
          transitionDuration: `${CROSSFADE_DURATION}ms`,
        }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      <video
        ref={videoBRef}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
        style={{
          ...baseStyle,
          opacity: activeVideo === 'B' || crossfadingRef.current === false
            ? baseStyle.opacity
            : 0,
          zIndex: activeVideo === 'B' ? 2 : 1,
          transitionDuration: `${CROSSFADE_DURATION}ms`,
        }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
    </>
  );
};
