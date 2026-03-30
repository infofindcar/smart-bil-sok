import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SearchAnimation } from './SearchAnimation';
import { Send, RotateCcw, Sparkles, PenLine, ChevronDown, Search } from 'lucide-react';

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
  regnr: string | null;
  horsepower: number | null;
  transmission: string | null;
  dealer_name: string | null;
  dealer_url: string | null;
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
  onScrollToResults?: () => void;
  onLanguageChange?: (lang: string) => void;
}

const GREETINGS: Record<string, ChatMessage> = {
  sv: {
    id: '1',
    role: 'assistant',
    content: 'Hej! 👋 Jag är Clutch, din personliga bilrådgivare. Berätta lite om dig och vad du letar efter — så hittar jag bilen som passar just dig.',
    suggestions: ['Jag pendlar till jobbet', 'Behöver en familjebil', 'Vill ha en rolig bil', 'Vet inte riktigt'],
  },
  en: {
    id: '1',
    role: 'assistant',
    content: 'Hi! 👋 I\'m Clutch, your personal car advisor. Tell me a bit about yourself and what you\'re looking for — and I\'ll find the perfect car for you.',
    suggestions: ['I commute to work', 'Need a family car', 'Want a fun car', 'Not sure yet'],
  },
  no: {
    id: '1',
    role: 'assistant',
    content: 'Hei! 👋 Jeg er Clutch, din personlige bilrådgiver. Fortell litt om deg og hva du leter etter — så finner jeg bilen som passer deg.',
    suggestions: ['Jeg pendler til jobb', 'Trenger en familiebil', 'Vil ha en morsom bil', 'Vet ikke helt'],
  },
  da: {
    id: '1',
    role: 'assistant',
    content: 'Hej! 👋 Jeg er Clutch, din personlige bilrådgiver. Fortæl lidt om dig selv og hvad du leder efter — så finder jeg bilen der passer dig.',
    suggestions: ['Jeg pendler til arbejde', 'Har brug for en familiebil', 'Vil have en sjov bil', 'Ved ikke rigtig'],
  },
  fi: {
    id: '1',
    role: 'assistant',
    content: 'Hei! 👋 Olen Clutch, henkilökohtainen autoneuvonantajasi. Kerro hieman itsestäsi ja mitä etsit — niin löydän sinulle täydellisen auton.',
    suggestions: ['Pendelöin töihin', 'Tarvitsen perheauton', 'Haluan hauskan auton', 'En ole varma'],
  },
};

const PLACEHOLDERS: Record<string, string> = {
  sv: 'Skriv här...',
  en: 'Type here...',
  no: 'Skriv her...',
  da: 'Skriv her...',
  fi: 'Kirjoita tähän...',
};

const WRITE_OWN: Record<string, string> = {
  sv: 'Skriv eget svar',
  en: 'Write your own',
  no: 'Skriv eget svar',
  da: 'Skriv eget svar',
  fi: 'Kirjoita oma vastaus',
};

const NEW_SEARCH: Record<string, string> = {
  sv: 'Ny sökning',
  en: 'New search',
  no: 'Nytt søk',
  da: 'Ny søgning',
  fi: 'Uusi haku',
};

const SEARCH_NOW: Record<string, string> = {
  sv: 'Sök direkt',
  en: 'Search now',
  no: 'Søk nå',
  da: 'Søg nu',
  fi: 'Hae nyt',
};

const SHOW_MATCHES: Record<string, string> = {
  sv: 'Visa mina matchningar',
  en: 'Show my matches',
  no: 'Vis mine treff',
  da: 'Vis mine match',
  fi: 'Näytä osumat',
};

const RESTART: Record<string, string> = {
  sv: 'Börja om',
  en: 'Start over',
  no: 'Start på nytt',
  da: 'Start forfra',
  fi: 'Aloita alusta',
};

const SUBTITLE: Record<string, string> = {
  sv: 'Objektiv bilrådgivare',
  en: 'Objective car advisor',
  no: 'Objektiv bilrådgiver',
  da: 'Objektiv bilrådgiver',
  fi: 'Objektiivinen autoneuvoja',
};

const CHAT_STORAGE_KEY = 'findcar-chat-state';

const loadChatState = (): { messages: ChatMessage[]; phase: Phase } | null => {
  try {
    const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

export const GuidedSearch = ({ onResults, onScrollToResults, onLanguageChange }: GuidedSearchProps) => {
  const savedChat = loadChatState();
  const [messages, setMessages] = useState<ChatMessage[]>(savedChat?.messages || [GREETINGS.sv]);
  const [phase, setPhase] = useState<Phase>(savedChat?.phase || 'chatting');
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('sv');
  const [inputFocused, setInputFocused] = useState(false);
  const [visibleText, setVisibleText] = useState<Record<string, string>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persist chat state
  useEffect(() => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, phase }));
  }, [messages, phase]);

  // Scroll only within the chat container, not the whole page
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [messages, isLoading, visibleText]);

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
        body: { messages: conversationHistory, language },
      });

      if (error) throw error;

      if (data?.action === 'ask') {
        addAssistantMessage(data.message, data.suggestions);
        setIsLoading(false);
      } else if (data?.action === 'search') {
        // Save driver age if available for insurance calculation
        if (data.filters?.driverAge) {
          sessionStorage.setItem('findcar-driver-age', JSON.stringify(data.filters.driverAge));
        }
        // Save search filters + customer profile for "load more"
        if (data.filters || data.customerProfile) {
          sessionStorage.setItem('findcar-last-filters', JSON.stringify({
            filters: data.filters,
            customerProfile: data.customerProfile || '',
          }));
        }
        setPhase('searching');
        addAssistantMessage('Perfekt, nu söker jag igenom tusentals bilar åt dig...');

        setPhase('results');
        setIsLoading(false);

        if (data.cars?.length > 0) {
          const resultMsg = data.message || `Jag hittade ${data.cars.length} perfekta matchningar!`;
          addAssistantMessage(
            `🎯 ${resultMsg}`,
            undefined,
            () => {
              // Trigger results after typewriter finishes
              onResults(data.cars, resultMsg, data.carReasons || []);
            }
          );
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

  const handleReset = (lang?: string) => {
    const l = lang || language;
    setMessages([GREETINGS[l] || GREETINGS.sv]);
    setPhase('chatting');
    setInputValue('');
    setVisibleText({});
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    sessionStorage.removeItem('findcar-search-state');
    sessionStorage.removeItem('findcar-results-revealed');
    sessionStorage.removeItem('findcar-driver-age');
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    handleReset(newLang);
    onLanguageChange?.(newLang);
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
      <div className="clutch-card rounded-2xl md:rounded-3xl overflow-hidden border border-secondary/[0.15] bg-card backdrop-blur-xl shadow-[0_8px_60px_-12px_hsl(var(--secondary)/0.12)] md:shadow-[0_8px_60px_-12px_hsl(var(--secondary)/0.12)]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between bg-gradient-to-r from-secondary/[0.04] to-primary/[0.03]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-secondary/15 to-primary/10 flex items-center justify-center border border-secondary/10">
                <Sparkles className="h-4.5 w-4.5 text-secondary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-card" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-tight text-foreground">Clutch <span className="text-[10px] font-medium text-secondary/70 ml-0.5">AI</span></h3>
              <p className="text-[11px] text-muted-foreground">{SUBTITLE[language] || SUBTITLE.sv}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-[11px] bg-transparent border border-border/40 rounded-md px-1.5 py-1 text-muted-foreground hover:text-foreground cursor-pointer outline-none focus:border-secondary/40 transition-colors"
            >
              <option value="sv">🇸🇪 SV</option>
              <option value="en">🇬🇧 EN</option>
              <option value="no">🇳🇴 NO</option>
              <option value="da">🇩🇰 DA</option>
              <option value="fi">🇫🇮 FI</option>
            </select>
            <button
              onClick={() => handleReset()}
              className="text-[11px] flex items-center gap-1 border border-border/40 rounded-md px-1.5 py-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors hover:border-secondary/40"
              title={RESTART[language] || RESTART.sv}
            >
              <RotateCcw className="h-3 w-3" />
              {RESTART[language] || RESTART.sv}
            </button>
          </div>
        </div>

        {/* Chat area — scroll is contained here */}
        <div
          ref={chatContainerRef}
          className="px-4 md:px-5 py-4 space-y-3 max-h-[55vh] md:max-h-[380px] overflow-y-auto chat-scrollbar min-h-[180px]"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'} animate-fade-in`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-secondary/20 to-primary/15 flex items-center justify-center shrink-0 mt-1 border border-secondary/20">
                  <Sparkles className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 md:py-2.5 text-base md:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-secondary to-secondary/90 text-secondary-foreground rounded-br-sm shadow-sm'
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
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-secondary/20 to-primary/15 flex items-center justify-center shrink-0 mt-1 border border-secondary/20">
                <Sparkles className="h-3 w-3 text-primary" />
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
            <div className="flex flex-col md:flex-row md:flex-wrap gap-2 md:gap-1.5">
              {lastAssistantMsg!.suggestions!.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full md:w-auto text-sm md:text-xs px-4 md:px-3 py-3 md:py-1.5 rounded-xl md:rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 text-foreground/90 transition-all duration-150 shadow-sm text-left"
                >
                  {s}
                </button>
              ))}
              <button
                onClick={() => inputRef.current?.focus()}
                className="w-full md:w-auto text-sm md:text-xs px-4 md:px-3 py-3 md:py-1.5 rounded-xl md:rounded-lg border border-dashed border-border bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center gap-2 md:gap-1"
              >
                <PenLine className="h-4 w-4 md:h-3 md:w-3" />
                {WRITE_OWN[language] || WRITE_OWN.sv}
              </button>
            </div>
          </div>
        )}

        {/* Search now button — always visible during chatting when user has sent at least one message */}
        {phase === 'chatting' && !isLoading && messages.some((m) => m.role === 'user') && (
          <div className="px-4 md:px-5 pb-3 flex justify-end">
            <button
              onClick={() => handleSendMessage(undefined, 'Sök nu med det du vet om mig')}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center gap-1"
            >
              <Search className="h-3 w-3" />
              {SEARCH_NOW[language] || SEARCH_NOW.sv}
            </button>
          </div>
        )}

        {/* Results CTA + Reset */}
        {phase === 'results' && !isLoading && (
          <div className="px-4 md:px-5 pb-3 space-y-2">
            {onScrollToResults && (
              <Button
                variant="gradient"
                size="default"
                onClick={onScrollToResults}
                className="w-full rounded-xl text-sm font-semibold"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                {SHOW_MATCHES[language] || SHOW_MATCHES.sv}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleReset()} className="w-full rounded-xl text-xs">
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              {NEW_SEARCH[language] || NEW_SEARCH.sv}
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
                placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.sv}
                disabled={isLoading}
                rows={1}
                className="w-full resize-none bg-transparent px-3.5 py-3 md:py-2.5 text-base md:text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 max-h-[100px]"
                style={{ minHeight: '44px' }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="h-11 w-11 md:h-10 md:w-10 rounded-xl shrink-0 bg-secondary hover:bg-secondary/90 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
