import { useState, useRef, useEffect, useCallback, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SearchAnimation } from './SearchAnimation';
import { Send, RotateCcw, Sparkles, PenLine, ChevronDown, ArrowDown, Mic, MicOff, Filter } from 'lucide-react';
import { toast } from 'sonner';

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

const STRICT_FILTER: Record<string, string> = {
  sv: 'Bara mina filter',
  en: 'Only my filters',
  no: 'Bare mine filtre',
  da: 'Kun mine filtre',
  fi: 'Vain omat suodattimet',
};

const STRICT_FILTER_MSG: Record<string, string> = {
  sv: 'Visa bara bilar som matchar mina exakta filter, inga extra förslag',
  en: 'Show only cars matching my exact filters, no extra suggestions',
  no: 'Vis bare biler som matcher mine eksakte filtre, ingen ekstra forslag',
  da: 'Vis kun biler der matcher mine præcise filtre, ingen ekstra forslag',
  fi: 'Näytä vain autot jotka vastaavat tarkkoja suodattimiani, ei ylimääräisiä ehdotuksia',
};

const MIC_NOT_SUPPORTED: Record<string, string> = {
  sv: 'Röstinmatning stöds inte i din webbläsare',
  en: 'Voice input is not supported in your browser',
  no: 'Stemmeinndata støttes ikke i nettleseren din',
  da: 'Stemmeinput understøttes ikke i din browser',
  fi: 'Äänisyöttöä ei tueta selaimessasi',
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
  const [isListening, setIsListening] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showTypingDots, setShowTypingDots] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const [visibleText, setVisibleText] = useState<Record<string, string>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const isAutoFollowRef = useRef(true);
  const isTypingRef = useRef(false);
  const scrollRafRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingDotsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetScrollTopRef = useRef(0);

  const confirmedTextRef = useRef('');

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast.error(MIC_NOT_SUPPORTED[language] || MIC_NOT_SUPPORTED.sv);
      return;
    }
    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'en' ? 'en-US' : language === 'fi' ? 'fi-FI' : language === 'no' ? 'nb-NO' : language === 'da' ? 'da-DK' : 'sv-SE';
      confirmedTextRef.current = inputValue;
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        if (finalTranscript) {
          confirmedTextRef.current = (confirmedTextRef.current ? confirmedTextRef.current + ' ' : '') + finalTranscript.trim();
        }
        const display = confirmedTextRef.current + (interimTranscript ? ' ' + interimTranscript : '');
        setInputValue(display.trim());
      };
      recognition.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === 'not-allowed') {
          toast.error(language === 'en' ? 'Microphone access denied' : 'Mikrofonåtkomst nekad');
        } else if (e.error !== 'aborted') {
          toast.error(MIC_NOT_SUPPORTED[language] || MIC_NOT_SUPPORTED.sv);
        }
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      toast.error(MIC_NOT_SUPPORTED[language] || MIC_NOT_SUPPORTED.sv);
    }
  }, [isListening, language, inputValue]);


  useEffect(() => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ messages, phase }));
  }, [messages, phase]);

  const stopScrollLoop = useCallback(() => {
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  }, []);

  const startScrollLoop = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    let lastTime = 0;
    const step = (timestamp: number) => {
      const container = chatContainerRef.current;
      if (!container) {
        scrollRafRef.current = null;
        return;
      }

      const target = targetScrollTopRef.current;
      const diff = target - container.scrollTop;

      if (Math.abs(diff) <= 0.5) {
        container.scrollTop = target;
        scrollRafRef.current = null;
        return;
      }

      const dt = lastTime ? Math.min((timestamp - lastTime) / 16.67, 2) : 1;
      lastTime = timestamp;

      const factor = Math.abs(diff) > 200 ? 0.18 : 0.12;
      container.scrollTop += diff * factor * dt;

      scrollRafRef.current = requestAnimationFrame(step);
    };

    scrollRafRef.current = requestAnimationFrame(step);
  }, []);

  const queueScrollToBottom = useCallback((force = false) => {
    const container = chatContainerRef.current;
    if (!container || (!force && !isAutoFollowRef.current)) return;

    requestAnimationFrame(() => {
      const liveContainer = chatContainerRef.current;
      if (!liveContainer || (!force && !isAutoFollowRef.current)) return;

      targetScrollTopRef.current = Math.max(0, liveContainer.scrollHeight - liveContainer.clientHeight);
      startScrollLoop();
    });
  }, [startScrollLoop]);

  // Scroll-to-bottom detection for the arrow button
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
      isAutoFollowRef.current = distanceFromBottom < 72;
      setShowScrollDown(distanceFromBottom > 120);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-resize textarea when inputValue changes (voice or clear)
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const newHeight = `${el.scrollHeight}px`;
      if (el.style.height !== newHeight) {
        el.style.height = newHeight;
      }
    });
  }, [inputValue]);

  // When input focuses on mobile, scroll chat to bottom
  useEffect(() => {
    if (inputFocused) {
      const timer = setTimeout(() => {
        queueScrollToBottom(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [inputFocused, queueScrollToBottom]);

  useEffect(() => {
    queueScrollToBottom(true);
  }, [messages.length, queueScrollToBottom]);

  // Delayed typing dots to prevent flicker
  useEffect(() => {
    if (isLoading && phase !== 'searching') {
      typingDotsTimerRef.current = setTimeout(() => setShowTypingDots(true), 300);
    } else {
      setShowTypingDots(false);
      if (typingDotsTimerRef.current) {
        clearTimeout(typingDotsTimerRef.current);
        typingDotsTimerRef.current = null;
      }
    }
    return () => {
      if (typingDotsTimerRef.current) {
        clearTimeout(typingDotsTimerRef.current);
      }
    };
  }, [isLoading, phase]);

  // Debounced scroll during typewriter — only every 200ms
  const lastTypeScrollRef = useRef(0);
  useEffect(() => {
    const now = Date.now();
    if (now - lastTypeScrollRef.current > 200) {
      lastTypeScrollRef.current = now;
      queueScrollToBottom(false);
    }
  }, [visibleText, queueScrollToBottom]);

  useEffect(() => {
    return () => {
      stopScrollLoop();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [stopScrollLoop]);

  const typewriteMessage = (msgId: string, fullText: string, onDone?: () => void) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    let i = 0;
    isTypingRef.current = true;
    isAutoFollowRef.current = true;
    setVisibleText((prev) => ({ ...prev, [msgId]: '' }));

    const getCharDelay = (char: string, nextChar: string) => {
      if ('.!?…'.includes(char) && (nextChar === ' ' || nextChar === '')) return 180 + Math.random() * 60;
      if (',;:'.includes(char) && nextChar === ' ') return 80 + Math.random() * 30;
      if (char === ' ') return 25 + Math.random() * 10;
      return 20 + Math.random() * 15;
    };

    const tick = () => {
      i += 1;
      setVisibleText((prev) => ({ ...prev, [msgId]: fullText.slice(0, i) }));

      if (i < fullText.length) {
        const currentChar = fullText[i - 1] || '';
        const nextChar = fullText[i] || '';
        typingTimeoutRef.current = setTimeout(tick, getCharDelay(currentChar, nextChar));
      } else {
        isTypingRef.current = false;
        queueScrollToBottom(true);
        onDone?.();
      }
    };

    typingTimeoutRef.current = setTimeout(tick, 200);
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
    navigator.vibrate?.(10);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
    }
    confirmedTextRef.current = '';
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
        if (data.filters?.driverAge) {
          sessionStorage.setItem('findcar-driver-age', JSON.stringify(data.filters.driverAge));
        }
        if (data.filters || data.customerProfile) {
          sessionStorage.setItem('findcar-last-filters', JSON.stringify({
            filters: data.filters,
            customerProfile: data.customerProfile || '',
          }));
        }
        setPhase('searching');
        addAssistantMessage('Perfekt, nu söker jag igenom tusentals bilar åt dig...');

        try {
          sessionStorage.setItem('findcar-user-profile', JSON.stringify({
            age: data.userAge ?? null,
            city: data.userCity ?? null,
          }));
        } catch {}

        setPhase('results');
        setIsLoading(false);

        if (data.cars?.length > 0) {
          const resultMsg = data.message || `Jag hittade ${data.cars.length} perfekta matchningar!`;
          onResults(data.cars, resultMsg, data.carReasons || []);
          setTimeout(() => {
            onScrollToResults?.();
          }, 600);
        } else {
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
      const errorMessages: Record<string, string> = {
        sv: 'Oj, något gick fel med sökningen. Kontrollera din internetanslutning och försök igen.',
        en: 'Oops, something went wrong. Check your connection and try again.',
        no: 'Noe gikk galt. Sjekk tilkoblingen og prøv igjen.',
        da: 'Noget gik galt. Tjek din forbindelse og prøv igen.',
        fi: 'Jokin meni pieleen. Tarkista yhteys ja yritä uudelleen.',
      };
      addAssistantMessage(
        errorMessages[language] || errorMessages.sv,
        [language === 'sv' ? 'Försök igen' : 'Try again']
      );
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

  const hasUserMessages = messages.some((m) => m.role === 'user');

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="clutch-card rounded-2xl overflow-hidden border border-border/40 bg-card shadow-sm">
        {/* Header */}
        <div className="px-5 py-3 border-b border-border/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-secondary" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-[1.5px] border-card" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-tight text-foreground">Clutch</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-[11px] bg-transparent border border-border/30 rounded-md px-1.5 py-1 text-muted-foreground hover:text-foreground cursor-pointer outline-none focus:border-secondary/40 transition-colors"
            >
              <option value="sv">🇸🇪 SV</option>
              <option value="en">🇬🇧 EN</option>
              <option value="no">🇳🇴 NO</option>
              <option value="da">🇩🇰 DA</option>
              <option value="fi">🇫🇮 FI</option>
            </select>
            <button
              onClick={() => handleReset()}
              className="text-[11px] flex items-center gap-1 border border-border/30 rounded-md px-1.5 py-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors hover:border-secondary/40"
              title={RESTART[language] || RESTART.sv}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Chat area — scroll is contained here */}
        <div
          ref={chatContainerRef}
          className="relative px-4 md:px-6 py-4 space-y-3 max-h-[55vh] md:max-h-[400px] overflow-y-auto chat-scrollbar min-h-[200px] pb-6"
        >
          {messages.map((msg, idx) => (
            <div
              key={msg.id}
              ref={idx === messages.length - 1 ? lastMessageRef : undefined}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'} animate-fade-in`}
              style={{ transition: 'all 0.2s ease-out' }}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-secondary/8 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="h-3 w-3 text-secondary/70" />
                </div>
              )}
              <div
                className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] md:text-sm leading-relaxed transition-[height] duration-200 ease-out overflow-hidden ${
                  msg.role === 'user'
                    ? 'bg-secondary text-secondary-foreground rounded-br-sm'
                    : 'bg-muted/40 text-foreground rounded-bl-sm'
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
          {showTypingDots && (
            <div className="flex justify-start gap-2 animate-fade-in">
              <div className="w-6 h-6 rounded-md bg-secondary/8 flex items-center justify-center shrink-0 mt-1">
                <Sparkles className="h-3 w-3 text-secondary/70" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-5 py-3.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '200ms' }} />
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-[bounce_1.2s_ease-in-out_infinite]" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* Scroll-to-bottom button */}
          {showScrollDown && (
            <button
              onClick={() => {
                isAutoFollowRef.current = true;
                queueScrollToBottom(true);
              }}
              className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border/50 shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-all hover:shadow-lg"
              style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block' }}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick-reply suggestions + Strict filter button */}
        {(showSuggestions || (phase === 'chatting' && !isLoading && hasUserMessages)) && (
          <div className="px-4 md:px-6 pb-3">
            <div className="flex flex-col md:flex-row md:flex-wrap gap-1.5 items-stretch md:items-center">
              {showSuggestions && lastAssistantMsg?.suggestions?.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full md:w-auto text-sm md:text-xs px-4 md:px-3 py-2.5 md:py-1.5 rounded-lg border border-border/50 bg-background/60 hover:bg-accent hover:border-border text-foreground/80 transition-all duration-150 text-left active:scale-[0.98]"
                >
                  {s}
                </button>
              ))}
              {showSuggestions && (
                <button
                  onClick={() => inputRef.current?.focus()}
                  className="w-full md:w-auto text-sm md:text-xs px-4 md:px-3 py-2.5 md:py-1.5 rounded-lg border border-dashed border-border/40 bg-transparent hover:bg-accent text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center gap-2 md:gap-1"
                >
                  <PenLine className="h-3.5 w-3.5 md:h-3 md:w-3" />
                  {WRITE_OWN[language] || WRITE_OWN.sv}
                </button>
              )}
              {phase === 'chatting' && !isLoading && hasUserMessages && (
                <button
                  onClick={() => handleSendMessage(undefined, STRICT_FILTER_MSG[language] || STRICT_FILTER_MSG.sv)}
                  className="w-full md:w-auto md:ml-auto text-sm md:text-[11px] px-4 md:px-3 py-2.5 md:py-1.5 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center gap-1"
                >
                  <Filter className="h-3 w-3" />
                  {STRICT_FILTER[language] || STRICT_FILTER.sv}
                </button>
              )}
            </div>
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
        <div ref={inputAreaRef} className="px-4 md:px-6 pb-4 pt-2 border-t border-border/20">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div
              className={`flex-1 relative rounded-xl border transition-all duration-200 ${
                isListening
                  ? 'border-primary/40 ring-2 ring-primary/20'
                  : inputFocused
                    ? 'border-secondary/30 ring-1 ring-secondary/10'
                    : 'border-border/30'
              } bg-background`}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  const el = e.currentTarget;
                  requestAnimationFrame(() => {
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                  });
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={isListening
                  ? (language === 'en' ? 'Listening...' : 'Lyssnar...')
                  : (PLACEHOLDERS[language] || PLACEHOLDERS.sv)}
                disabled={isLoading}
                rows={1}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                name="clutch-chat-input"
                className="w-full resize-none bg-transparent px-3.5 py-2.5 text-[15px] md:text-sm outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/40 disabled:opacity-50 max-h-[120px] overflow-y-auto leading-relaxed"
                style={{ minHeight: '42px' }}
              />
            </div>
            {speechSupported && (
              <button
                type="button"
                onClick={() => { navigator.vibrate?.(10); toggleListening(); }}
                disabled={isLoading}
                className={`relative h-[42px] w-[42px] md:h-10 md:w-10 rounded-xl shrink-0 flex items-center justify-center transition-all border ${
                  isListening
                    ? 'bg-primary/10 border-primary/40 text-primary mic-listening'
                    : 'border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60'
                } disabled:opacity-50`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              className="h-[42px] w-[42px] md:h-10 md:w-10 rounded-xl shrink-0 bg-secondary hover:bg-secondary/90 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
