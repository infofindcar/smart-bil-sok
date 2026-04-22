import { useState, useRef, useEffect, useCallback, memo, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SearchAnimation } from './SearchAnimation';
import { Send, RotateCcw, Sparkles, PenLine, ChevronDown, ArrowDown, Mic, MicOff, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const isMobile = useIsMobile();
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
  const lastTextareaHeightRef = useRef<number>(0);
  const animatedMsgIdsRef = useRef<Set<string>>(new Set());

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

  // On mobile, auto-expand when user starts chatting
  useEffect(() => {
    if (isMobile && messages.length > 1 && !mobileExpanded) {
      setMobileExpanded(true);
    }
  }, [isMobile, messages.length, mobileExpanded]);

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

  // Auto-resize textarea when inputValue changes (voice or clear) — cache last height
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.height = 'auto';
      const next = el.scrollHeight;
      if (next !== lastTextareaHeightRef.current) {
        el.style.height = `${next}px`;
        lastTextareaHeightRef.current = next;
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
    let pendingFrame: number | null = null;
    isTypingRef.current = true;
    isAutoFollowRef.current = true;
    animatedMsgIdsRef.current.add(msgId);
    setVisibleText((prev) => ({ ...prev, [msgId]: '' }));

    const getCharDelay = (char: string, nextChar: string) => {
      if ('.!?…'.includes(char) && (nextChar === ' ' || nextChar === '')) return 55 + Math.random() * 18;
      if (',;:'.includes(char) && nextChar === ' ') return 26 + Math.random() * 12;
      if (char === ' ') return 7 + Math.random() * 4;
      return 5 + Math.random() * 5;
    };

    // Batch state updates inside a single rAF so React commits at most once per frame
    const commit = () => {
      pendingFrame = null;
      setVisibleText((prev) => ({ ...prev, [msgId]: fullText.slice(0, i) }));
    };
    const scheduleCommit = () => {
      if (pendingFrame !== null) return;
      pendingFrame = requestAnimationFrame(commit);
    };

    const tick = () => {
      i += 1;
      scheduleCommit();

      if (i < fullText.length) {
        const currentChar = fullText[i - 1] || '';
        const nextChar = fullText[i] || '';
        typingTimeoutRef.current = setTimeout(tick, getCharDelay(currentChar, nextChar));
      } else {
        // Final flush
        if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
        setVisibleText((prev) => ({ ...prev, [msgId]: fullText }));
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

