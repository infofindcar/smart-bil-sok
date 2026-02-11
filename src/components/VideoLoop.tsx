import { useRef, useEffect } from 'react';

interface VideoLoopProps {
  scrollProgress: number;
}

export const VideoLoop = ({ scrollProgress }: VideoLoopProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start playing only when the element is in view
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      muted
      loop
      playsInline
      preload="none"
      className="absolute inset-0 w-full h-full object-cover bg-foreground/90"
      style={{ opacity: 1 - scrollProgress * 0.3 }}
    >
      <source src="/hero-video.mp4" type="video/mp4" />
    </video>
  );
};
