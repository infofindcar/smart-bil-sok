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
  suggestions?: string[];
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
  const [visibleText, setVisibleText] = useState<Record<string, string>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Typewriter effect for assistant messages
  const typewriteMessage = (msgId: string, fullText: string, onDone?: () => void) => {
    let i = 0;
    const speed = 18; // ms per character
    const tick = () => {
      i += 1;
      setVisibleText((prev) => ({ ...prev, [msgId]: fullText.slice(0, i) }));
      if (i < fullText.length) {
        setTimeout(tick, speed + Math.random() * 12);
      } else {
        onDone?.();
      }
    };
    setVisibleText((prev) => ({ ...prev, [msgId]: '' }));
    setTimeout(tick, 300); // small initial delay
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
      // Build conversation history for the AI
      const allMessages = [...messages, userMsg];
      const conversationHistory = allMessages
        .filter((m) => m.id !== '1') // exclude initial greeting
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
          onResults(data.cars, data.message || `Hittade ${data.cars.length} bilar`);
        } else {
          addAssistantMessage(
            data.message || 'Tyvärr hittade jag inga bilar som matchar just nu. Beskriv dina behov på ett annat sätt!'
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

  // Get the displayed text for a message (typewriter or full)
  const getDisplayText = (msg: ChatMessage) => {
    if (msg.role === 'user') return msg.content;
    return visibleText[msg.id] !== undefined ? visibleText[msg.id] : msg.content;
  };

  // Check if a message is still being typed
  const isTyping = (msg: ChatMessage) => {
    if (msg.role === 'user') return false;
    const displayed = visibleText[msg.id];
    return displayed !== undefined && displayed.length < msg.content.length;
  };

  // Find the last assistant message to show suggestions on
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
  const showSuggestions =
    !isLoading &&
    lastAssistantMsg?.suggestions?.length &&
    !isTyping(lastAssistantMsg);

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
                {getDisplayText(msg)}
                {isTyping(msg) && (
                  <span className="inline-block w-0.5 h-4 bg-foreground/60 ml-0.5 animate-pulse align-text-bottom" />
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator while loading */}
          {isLoading && phase === 'searching' && <SearchAnimation />}
          {isLoading && phase !== 'searching' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-chat-bubble rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick-reply suggestions */}
        {showSuggestions && (
          <div className="px-4 md:px-5 pb-3">
            <div className="flex flex-wrap gap-2">
              {lastAssistantMsg!.suggestions!.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="text-xs px-3 py-2 rounded-xl border border-border/50 bg-accent/30 hover:bg-accent/60 hover:border-primary/30 text-foreground transition-all duration-200"
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
