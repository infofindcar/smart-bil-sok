import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';

// GDPR-samtycke: lagras som 'accepted' eller 'declined' i localStorage.
// Tidigare version (findcar_cookies_accepted = 'true') behandlas som
// "ej besvarat" så bannern visas igen för dem.
const COOKIE_KEY = 'findcar_cookie_consent';
type Consent = 'accepted' | 'declined' | null;

const getConsent = (): Consent => {
  try {
    const v = localStorage.getItem(COOKIE_KEY);
    if (v === 'accepted' || v === 'declined') return v;
  } catch {}
  return null;
};

export const CookieBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (getConsent() === null) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const setConsent = (val: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(COOKIE_KEY, val);
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-2xl mx-auto bg-card rounded-2xl shadow-warm-lg border border-border p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Cookie className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">Vi använder cookies</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nödvändiga cookies används alltid för att tjänsten ska fungera. Vi använder
              också anonym statistik för att förbättra Clutch och sökresultaten — du kan
              välja om du vill tillåta det.
            </p>
            <a
              href="/privacy"
              className="text-xs text-primary hover:underline inline-block mt-1.5"
            >
              Läs vår integritetspolicy →
            </a>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConsent('declined')}
            className="text-muted-foreground hover:text-foreground sm:order-1"
          >
            Endast nödvändiga
          </Button>
          <Button size="sm" onClick={() => setConsent('accepted')} className="sm:order-2">
            Acceptera alla
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Hjälpfunktion: andra delar av appen kan kolla om användaren har samtyckt
 *  till statistik-cookies. Returnerar true om accepterat, false om avböjt
 *  eller om inget val gjorts än. */
export const hasAnalyticsConsent = (): boolean => getConsent() === 'accepted';
