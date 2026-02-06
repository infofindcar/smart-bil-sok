import { useRef, useEffect, useState } from 'react';
import heroVideo from '@/assets/hero-video.mp4';

interface VideoLoopProps {
  scrollProgress: number;
}

export const VideoLoop = ({ scrollProgress }: VideoLoopProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loopOverlay, setLoopOverlay] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration && video.currentTime >= video.duration - 0.8) {
        setLoopOverlay(true);
      }
    };

    const handleSeeked = () => {
      // After loop restarts, hold overlay briefly then fade out
      setTimeout(() => setLoopOverlay(false), 200);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 1 - scrollProgress * 0.3 }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>
      {/* Smooth overlay to mask loop transition */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-700 ease-in-out pointer-events-none"
        style={{ opacity: loopOverlay ? 0.5 : 0 }}
      />
    </>
  );
};
