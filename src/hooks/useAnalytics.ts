import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasAnalyticsConsent } from '@/components/CookieBanner';

export const useAnalytics = () => {
  const track = useCallback(async (eventName: string, eventData?: Record<string, unknown>) => {
    if (!hasAnalyticsConsent()) return;
    try {
      await supabase.functions.invoke('track-analytics', {
        body: {
          eventName,
          eventData,
          pagePath: window.location.pathname,
          userAgent: navigator.userAgent,
        },
      });
    } catch (e) {
      console.error('Analytics error:', e);
    }
  }, []);

  return { track };
};
