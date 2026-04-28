import { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, X, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const STORAGE_KEY = 'findcar-feedback-widget-state';

const feedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(3, 'Skriv minst 3 tecken')
    .max(2000, 'Max 2000 tecken'),
  email: z
    .string()
    .trim()
    .email('Ogiltig e-postadress')
    .max(255)
    .optional()
    .or(z.literal('')),
});

type WidgetState = 'open' | 'closed';

export const FeedbackWidget = () => {
  // Default to open so users discover it; remember user's choice afterwards
  const [state, setState] = useState<WidgetState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved === 'closed' ? 'closed' : 'open';
    } catch {
      return 'open';
    }
  });
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, state);
    } catch {}
  }, [state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse({ message, email });
    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message || 'Vänligen kontrollera fälten';
      toast.error(firstError);
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('forbattringar').insert({
        message: parsed.data.message,
        email: parsed.data.email ? parsed.data.email : null,
        page_path:
          typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : null,
        user_agent:
          typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
      if (error) throw error;
      setSubmitted(true);
      setMessage('');
      setEmail('');
      toast.success('Tack för ditt förslag!');
      // Auto-close after a brief moment
      setTimeout(() => {
        setState('closed');
        setSubmitted(false);
      }, 2200);
    } catch (err) {
      console.error('Feedback submit failed:', err);
      toast.error('Kunde inte skicka. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (state === 'closed') {
    return (
      <button
        type="button"
        onClick={() => {
          setState('open');
          setTimeout(() => textareaRef.current?.focus(), 50);
        }}
        aria-label="Öppna förslagslåda"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Skicka förbättringsförslag"
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[60] w-[calc(100vw-2rem)] max-w-[340px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-border/40">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground leading-tight">
            Hjälp oss bli bättre
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Anonymt — e-post är frivilligt
          </div>
        </div>
        <button
          type="button"
          onClick={() => setState('closed')}
          aria-label="Stäng"
          className="shrink-0 -mr-1 -mt-1 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {submitted ? (
        <div className="px-4 py-6 text-center">
          <div className="text-sm font-medium text-foreground">Tack! 🙌</div>
          <div className="text-xs text-muted-foreground mt-1">
            Vi läser allt.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="px-4 py-3 space-y-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Vad kan vi förbättra?"
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Din e-post (valfritt)"
            maxLength={255}
            autoComplete="email"
            className="w-full rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition"
          />
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground text-sm font-medium px-3 py-2 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? 'Skickar…' : 'Skicka förslag'}
          </button>
        </form>
      )}
    </div>
  );
};

export default FeedbackWidget;