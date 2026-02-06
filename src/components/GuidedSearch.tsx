import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SearchAnimation } from './SearchAnimation';
import { Send, Sparkles, RotateCcw } from 'lucide-react';

export type Car = {
  id: number;
  make: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  mileage: number | null;
  fuel_type: string | null;
  body_type: string | null;
  drivetrain: string | null;
  city: string | null;
  color: string | null;
  image_thumb_url: string | null;
  listing_url: string | null;
};

type Phase = 'chatting' | 'searching' | 'results';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

interface GuidedSearchProps {
  onResults: (cars: Car[], message: string) => void;
}

const GREETING: ChatMessage = {
  id: '1',
  role: 'assistant',
  content:
    'Hej! Jag är Clutch — din objektiva bilrådgivare. Beskriv kort vad du behöver så hjälper jag dig hitta den perfekta bilen.',
};

export const GuidedSearch = ({ onResults }: GuidedSearchProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [phase, setPhase] = useState<Phase>('chatting');
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = (msg: Omit<ChatMessage, 'id'>) => {
    const newMsg = { ...msg, id: Date.now().toString() + Math.random() };
    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');
    const userMsg = addMessage({ role: 'user', content: text });
    setIsLoading(true);

    try {
      // Build conversation history for the AI
      const conversationHistory = [...messages, userMsg]
        .filter((m) => m.id !== '1') // exclude the initial greeting
        .map((m) => ({ role: m.role, content: m.content }));

      // If this is the first message, just include it
      if (conversationHistory.length === 0) {
        conversationHistory.push({ role: 'user', content: text });
      }

      const { data, error } = await supabase.functions.invoke('guided-search', {
        body: { messages: conversationHistory },
      });

      if (error) throw error;

      if (data?.action === 'ask') {
        // AI wants to ask a follow-up question
        addMessage({ role: 'assistant', content: data.message });
        setIsLoading(false);
      } else if (data?.action === 'search') {
        // AI decided to search — show animation then results
        setPhase('searching');
        addMessage({ role: 'assistant', content: '🔍 Clutch söker efter din perfekta bil...' });

        // Brief delay for search animation
        await new Promise((r) => setTimeout(r, 1500));

        setPhase('results');
        setIsLoading(false);

        if (data.cars?.length > 0) {
          addMessage({ role: 'assistant', content: data.message || `Jag hittade ${data.cars.length} bilar!` });
          onResults(data.cars, data.message || `Hittade ${data.cars.length} bilar`);
        } else {
          addMessage({
            role: 'assistant',
            content: data.message || 'Tyvärr hittade jag inga bilar som matchar just nu. Beskriv dina behov på ett annat sätt!',
          });
        }
      } else {
        // Error or unexpected response
        addMessage({ role: 'assistant', content: data?.message || 'Något gick fel. Försök igen!' });
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Guided search error:', err);
      addMessage({ role: 'assistant', content: 'Något gick fel. Försök igen!' });
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([GREETING]);
    setPhase('chatting');
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-2xl md:rounded-3xl overflow-hidden border border-border/60 bg-card/80 backdrop-blur-xl shadow-[0_8px_60px_-15px_hsl(var(--primary)/0.15)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/50 flex items-center gap-3 bg-gradient-to-r from-card to-accent/20">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-card" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">Clutch AI</h3>
            <p className="text-xs text-muted-foreground">Din personliga bilrådgivare</p>
          </div>
        </div>

        {/* Chat area */}
        <div className="px-4 md:px-5 py-4 space-y-3 max-h-[350px] md:max-h-[400px] overflow-y-auto chat-scrollbar min-h-[200px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md shadow-sm'
                    : 'bg-chat-bubble text-foreground rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && phase === 'searching' && <SearchAnimation />}
          {isLoading && phase !== 'searching' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-chat-bubble rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Reset button (shown after results) */}
        {phase === 'results' && !isLoading && (
          <div className="px-4 md:px-5 pb-3">
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full rounded-xl">
              <RotateCcw className="h-4 w-4 mr-2" />
              Ny sökning
            </Button>
          </div>
        )}

        {/* Input area */}
        <div className="px-4 md:px-5 pb-4 pt-2 border-t border-border/40">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div
              className={`flex-1 relative rounded-xl border transition-all duration-200 ${
                inputFocused
                  ? 'border-primary/50 shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]'
                  : 'border-border/50'
              } bg-background/60`}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Beskriv din situation..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60 disabled:opacity-50 max-h-[100px]"
                style={{ minHeight: '44px' }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="h-11 w-11 rounded-xl shrink-0 bg-gradient-to-br from-primary to-secondary hover:shadow-md transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
