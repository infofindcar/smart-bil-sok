import { useRef, useEffect, useState } from 'react';
import heroVideo from '@/assets/hero-video.mp4';

interface VideoLoopProps {
  scrollProgress: number;
}

export const VideoLoop = ({ scrollProgress }: VideoLoopProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Start fading 1.5s before the end
      if (video.duration && video.currentTime >= video.duration - 1.5) {
        setFading(true);
      } else {
        setFading(false);
      }
    };

    const handleSeeked = () => {
      // After loop restarts, fade back in
      setFading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('seeked', handleSeeked);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
      style={{ opacity: fading ? 0.3 : (1 - scrollProgress * 0.3) }}
    >
      <source src={heroVideo} type="video/mp4" />
    </video>
  );
};
