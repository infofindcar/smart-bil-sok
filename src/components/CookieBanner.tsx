import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

const COOKIE_KEY = 'findcar_cookies_accepted';

export const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setShow(true), 1500);
      // Auto-dismiss after 8 seconds so it doesn't block chat input
      const autoDismiss = setTimeout(() => {
        localStorage.setItem(COOKIE_KEY, 'true');
        setShow(false);
      }, 9500); // 1500 delay + 8000 visible
      return () => { clearTimeout(timer); clearTimeout(autoDismiss); };
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-card rounded-2xl shadow-warm-lg border border-border p-4 flex items-center gap-3">
        <Cookie className="h-5 w-5 text-primary flex-shrink-0" />
        <p className="text-xs text-muted-foreground flex-1">
          Vi använder cookies för att förbättra din upplevelse.{' '}
          <a href="/privacy" className="text-primary hover:underline">Läs mer</a>.
        </p>
        <Button size="sm" onClick={accept}>OK</Button>
      </div>
    </div>
  );
};
