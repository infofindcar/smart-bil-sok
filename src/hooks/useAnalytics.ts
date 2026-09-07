import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { hasAnalyticsConsent } from '@/components/CookieBanner';

/**
 * Händelser som är rent aggregerade — de innehåller inget som kan kopplas
 * till en person och kräver därför inget cookie-samtycke (ingen cookie sätts,
 * ingen identifierare lagras i webbläsaren).
 */
const CONSENT_FREE_EVENTS = new Set([
  'page_view',
  'search_started',
  'search_results',
  'search_no_results',
  'car_view',
  'lead_submitted',
]);

async function sendEvent(eventName: string, eventData?: Record<string, unknown>) {
  if (!CONSENT_FREE_EVENTS.has(eventName) && !hasAnalyticsConsent()) return;
  try {
    await supabase.functions.invoke('track-analytics', {
      body: {
        eventName,
        eventData,
        pagePath: window.location.pathname,
        userAgent: navigator.userAgent,
        referrer: document.referrer || '',
      },
    });
  } catch {
    // Statistik får aldrig påverka kundupplevelsen
  }
}

export const useAnalytics = () => {
  const track = useCallback(
    (eventName: string, eventData?: Record<string, unknown>) => sendEvent(eventName, eventData),
    [],
  );
  return { track };
};

/** Loggar en anonym sidvisning vid varje sidbyte. */
export const usePageViewTracking = () => {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Adminsidan är intern och ska inte räknas som trafik
    if (location.pathname.startsWith('/admin')) return;
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    sendEvent('page_view');
  }, [location.pathname]);
};

export const trackEvent = sendEvent;
