import { useEffect, useRef, useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

export const FEEDBACK_OPEN_EVENT = 'findcar:open-feedback';
export const openFeedback = () =>
  window.dispatchEvent(new Event(FEEDBACK_OPEN_EVENT));

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

export const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setSubmitted(false);
      setTimeout(() => textareaRef.current?.focus(), 80);
    };
    window.addEventListener(FEEDBACK_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(FEEDBACK_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

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
      });
      if (error) throw error;
      setSubmitted(true);
      setMessage('');
      setEmail('');
      toast.success('Tack för ditt förslag!');
      // Auto-close after a brief moment
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 2200);
    } catch (err) {
      console.error('Feedback submit failed:', err);
      toast.error('Kunde inte skicka. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setOpen(false)}
      />
      <div
      role="dialog"
      aria-modal="true"
      aria-label="Skicka förbättringsförslag"
      className="relative w-full max-w-[400px] rounded-2xl border border-border/60 bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
          onClick={() => setOpen(false)}
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
    </div>
  );
};

export default FeedbackWidget;