import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SearchAnimation } from './SearchAnimation';
import { Send, RotateCcw, MessageCircle } from 'lucide-react';

export type Car = {
  id: number;
  make: string | null;
  model: string | null;
  model_raw: string | null;
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

export type CarReason = {
  carId: number;
  reason: string;
};

type Phase = 'chatting' | 'searching' | 'results';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
};

interface GuidedSearchProps {
  onResults: (cars: Car[], message: string, carReasons: CarReason[]) => void;
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
  const [visibleText, setVisibleText] = useState<Record<string, string>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll only within the chat container, not the whole page
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const typewriteMessage = (msgId: string, fullText: string, onDone?: () => void) => {
    let i = 0;
    const speed = 15;
    const tick = () => {
      i += 1;
      setVisibleText((prev) => ({ ...prev, [msgId]: fullText.slice(0, i) }));
      if (i < fullText.length) {
        setTimeout(tick, speed + Math.random() * 10);
      } else {
        onDone?.();
      }
    };
    setVisibleText((prev) => ({ ...prev, [msgId]: '' }));
    setTimeout(tick, 250);
  };

  const addAssistantMessage = (
    content: string,
    suggestions?: string[],
    onDone?: () => void
  ) => {
    const id = Date.now().toString() + Math.random();
    const msg: ChatMessage = { id, role: 'assistant', content, suggestions };
    setMessages((prev) => [...prev, msg]);
    typewriteMessage(id, content, onDone);
    return msg;
  };

  const addUserMessage = (content: string) => {
    const id = Date.now().toString() + Math.random();
    const msg: ChatMessage = { id, role: 'user', content };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const handleSendMessage = async (e?: FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const text = (overrideText || inputValue).trim();
    if (!text || isLoading) return;

    setInputValue('');
    const userMsg = addUserMessage(text);
    setIsLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const conversationHistory = allMessages
        .filter((m) => m.id !== '1')
        .map((m) => ({ role: m.role, content: m.content }));

      if (conversationHistory.length === 0) {
        conversationHistory.push({ role: 'user', content: text });
      }

      const { data, error } = await supabase.functions.invoke('guided-search', {
        body: { messages: conversationHistory },
      });

      if (error) throw error;

      if (data?.action === 'ask') {
        addAssistantMessage(data.message, data.suggestions);
        setIsLoading(false);
      } else if (data?.action === 'search') {
        setPhase('searching');
        addAssistantMessage('Perfekt, nu söker jag igenom tusentals bilar åt dig...');

        await new Promise((r) => setTimeout(r, 2000));

        setPhase('results');
        setIsLoading(false);

        if (data.cars?.length > 0) {
          addAssistantMessage(
            data.message || `Jag hittade ${data.cars.length} bilar!`
          );
          onResults(data.cars, data.message || `Hittade ${data.cars.length} bilar`, data.carReasons || []);
        } else {
          // No results — show message with suggestions
          addAssistantMessage(
            data.message || 'Tyvärr hittade jag inga bilar som matchar just nu.',
            data.suggestions || []
          );
        }
      } else {
        addAssistantMessage(data?.message || 'Något gick fel. Försök igen!');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Guided search error:', err);
      addAssistantMessage('Något gick fel. Försök igen!');
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSendMessage(undefined, text);
  };

  const handleReset = () => {
    setMessages([GREETING]);
    setPhase('chatting');
    setInputValue('');
    setVisibleText({});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getDisplayText = (msg: ChatMessage) => {
    if (msg.role === 'user') return msg.content;
    return visibleText[msg.id] !== undefined ? visibleText[msg.id] : msg.content;
  };

  const isTypingMsg = (msg: ChatMessage) => {
    if (msg.role === 'user') return false;
    const displayed = visibleText[msg.id];
    return displayed !== undefined && displayed.length < msg.content.length;
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const showSuggestions =
    !isLoading &&
    lastAssistantMsg?.suggestions?.length &&
    !isTypingMsg(lastAssistantMsg);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="clutch-card rounded-2xl md:rounded-3xl overflow-hidden border border-border/40 bg-card backdrop-blur-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/30 flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
              <MessageCircle className="h-4.5 w-4.5 text-secondary" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-tight text-foreground">Clutch</h3>
            <p className="text-[11px] text-muted-foreground">Objektiv bilrådgivare</p>
          </div>
        </div>

        {/* Chat area — scroll is contained here */}
        <div
          ref={chatContainerRef}
          className="px-4 md:px-5 py-4 space-y-3 max-h-[340px] md:max-h-[380px] overflow-y-auto chat-scrollbar min-h-[180px]"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'} animate-fade-in`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-secondary/8 flex items-center justify-center shrink-0 mt-1">
                  <MessageCircle className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-secondary text-secondary-foreground rounded-br-sm'
                    : 'bg-muted/50 text-foreground rounded-bl-sm'
                }`}
              >
                {getDisplayText(msg)}
                {isTypingMsg(msg) && (
                  <span className="inline-block w-0.5 h-3.5 bg-foreground/40 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </div>
            </div>
          ))}

          {isLoading && phase === 'searching' && <SearchAnimation />}
          {isLoading && phase !== 'searching' && (
            <div className="flex justify-start gap-2 animate-fade-in">
              <div className="w-6 h-6 rounded-md bg-secondary/8 flex items-center justify-center shrink-0 mt-1">
                <MessageCircle className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick-reply suggestions */}
        {showSuggestions && (
          <div className="px-4 md:px-5 pb-3">
            <div className="flex flex-wrap gap-1.5">
              {lastAssistantMsg!.suggestions!.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border/40 bg-background hover:bg-muted/60 hover:border-border text-foreground/80 transition-all duration-150"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reset button */}
        {phase === 'results' && !isLoading && (
          <div className="px-4 md:px-5 pb-3">
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full rounded-xl text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              Ny sökning
            </Button>
          </div>
        )}

        {/* Input area */}
        <div className="px-4 md:px-5 pb-4 pt-2 border-t border-border/30">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div
              className={`flex-1 relative rounded-xl border transition-all duration-200 ${
                inputFocused
                  ? 'border-secondary/40 shadow-[0_0_0_2px_hsl(var(--secondary)/0.06)]'
                  : 'border-border/40'
              } bg-background/80`}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Skriv här..."
                disabled={isLoading}
                rows={1}
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 max-h-[100px]"
                style={{ minHeight: '40px' }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="h-10 w-10 rounded-xl shrink-0 bg-secondary hover:bg-secondary/90 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
