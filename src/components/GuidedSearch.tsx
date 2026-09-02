import { useState, useRef, useEffect, useCallback, memo, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SearchAnimation } from './SearchAnimation';
import { Send, RotateCcw, Sparkles, PenLine, ChevronDown, ArrowDown, Mic, MicOff, Info, Check, X, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Slider } from '@/components/ui/slider';

/**
 * Vissa frågor rymmer flera svar samtidigt (utrustning, växellåda, drivlina,
 * karosstyp). Om AI:n glömmer sätta multiSelect gissar vi det från frågans text
 * så att kunden alltid kan markera flera chips.
 */
const MULTI_HINT =
  /(utrustning|krav|växellåda|vaxellada|automatl|dragkrok|drivlina|bränsl|bransl|karosstyp|biltyp|måste ha|maste ha|tillval|flera)/i;

const inferMultiSelect = (message?: string, suggestions?: string[]): boolean => {
  if (!suggestions || suggestions.length < 2) return false;
  return MULTI_HINT.test(message || '');
};

/** Är detta en budget-/prisfråga? Då visar vi även en prisreglage-möjlighet. */
const isPriceQuestion = (message?: string, suggestions?: string[]): boolean => {
  if (!message) return false;
  if (!/(budget|pris|kosta|betala|spendera)/i.test(message)) return false;
  return (suggestions || []).some((s) => /kr|000/i.test(s)) || /budget/i.test(message);
};

const formatSek = (v: number) => `${v.toLocaleString('sv-SE')} kr`;


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

type ConfirmData = {
  filters: Record<string, unknown>;
  customerProfile: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  multiSelect?: boolean;
  confirm?: ConfirmData;
};

interface GuidedSearchProps {
  onResults: (
    cars: Car[],
    message: string,
    carReasons: CarReason[],
    append?: boolean,
    relaxations?: string[],
  ) => void;
  onScrollToResults?: () => void;
  onLanguageChange?: (lang: string) => void;
}

// Svenska etiketter för filtren i sammanfattningskortet
const FILTER_LABELS: Record<string, string> = {
  budget: 'Budget',
  make: 'Märke',
  model: 'Modell',
  bodyType: 'Karosstyp',
  fuel: 'Drivmedel',
  transmission: 'Växellåda',
  drivetrain: 'Drivning',
  city: 'Plats',
  color: 'Färg',
  yearMin: 'Från årsmodell',
  yearMax: 'Till årsmodell',
  features: 'Tillval',
  useCase: 'Användning',
  vibe: 'Känsla',
  dealerInclude: 'Bilfirma',
  dealerExclude: 'Ej bilfirma',
};


const filterChips = (filters: Record<string, unknown>) =>
  Object.entries(filters || {})
    .filter(([key, value]) => {
      if (!FILTER_LABELS[key]) return false;
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    })
    .map(([key, value]) => ({
      key,
      label: `${FILTER_LABELS[key]}: ${Array.isArray(value) ? value.join(', ') : String(value)}`,
    }));


const SV_GREETING_VARIANTS: Array<{ content: string; suggestions: string[] }> = [
  {
    content: 'Hej! Jag är Clutch. Berätta vad du letar efter — så fixar jag resten.',
    suggestions: ['Pendlar till jobbet', 'Vi behöver familjebil', 'Vill ha något roligt att köra', 'Vet inte riktigt'],
  },
  {
    content: 'Hallå! Jag är Clutch. Vad ska bilen användas till, ungefär?',
    suggestions: ['Jobbet, kör dagligen', 'Familjebil med plats', 'Sportig och rolig', 'Inte helt säker'],
  },
  {
    content: 'Hej! Kul att du hörde av dig. Jag hjälper dig hitta rätt bil. Vad har du för situation?',
    suggestions: ['Pendlar till jobbet', 'Behöver familjebil', 'Vill ha något kul', 'Vet inte än'],
  },
  {
    content: 'Hej! Jag är Clutch — din objektiva bilrådgivare. Vad letar du efter?',
    suggestions: ['Pendlarbil för jobbet', 'Familjebil', 'Rolig/sportig bil', 'Hjälp mig välja'],
  },
];

const getRandomGreeting = (): ChatMessage => {
  const v = SV_GREETING_VARIANTS[Math.floor(Math.random() * SV_GREETING_VARIANTS.length)];
  return { id: '1', role: 'assistant', ...v };
};

const GREETINGS: Record<string, () => ChatMessage> = {
  sv: getRandomGreeting,
  en: () => ({
    id: '1',
    role: 'assistant',
    content: "Hi! I'm Clutch, your personal car advisor. Tell me a bit about what you're looking for.",
    suggestions: ['I commute to work', 'Need a family car', 'Want something fun to drive', 'Not sure yet'],
  }),
  no: () => ({
    id: '1',
    role: 'assistant',
    content: 'Hei! Jeg er Clutch. Hva slags bil leter du etter?',
    suggestions: ['Jeg pendler til jobb', 'Trenger familiebil', 'Vil ha noe gøy å kjøre', 'Vet ikke helt'],
  }),
  da: () => ({
    id: '1',
    role: 'assistant',
    content: 'Hej! Jeg er Clutch. Hvad leder du efter?',
    suggestions: ['Jeg pendler til arbejde', 'Har brug for familiebil', 'Vil have noget sjovt', 'Ved ikke rigtig'],
  }),
  fi: () => ({
    id: '1',
    role: 'assistant',
    content: 'Hei! Olen Clutch. Mitä olet etsimässä?',
    suggestions: ['Pendelöin töihin', 'Tarvitsen perheauton', 'Haluan jotain hauskaa', 'En ole varma'],
  }),
};

const PLACEHOLDERS: Record<string, string> = {
  sv: 'Skriv här...',
  en: 'Type here...',
  no: 'Skriv her...',
  da: 'Skriv her...',
  fi: 'Kirjoita tähän...',
};

// Rotating placeholder examples — gives users concrete inspiration for what to write.
const PLACEHOLDER_EXAMPLES: Record<string, string[]> = {
  sv: [
    'Försök t.ex. "Pendlar 5 mil till jobbet, bensin under 150k"',
    'Försök t.ex. "Familj med två barn, behöver stort bagage"',
    'Försök t.ex. "Elbil med bra räckvidd, max 350k"',
    'Försök t.ex. "Liten bil för stan, automatlåda"',
  ],
  en: [
    'Try e.g. "I commute 50 km, petrol under 150k"',
    'Try e.g. "Family with two kids, need big trunk"',
    'Try e.g. "EV with good range, max 350k"',
    'Try e.g. "Small city car, automatic"',
  ],
  no: ['Skriv f.eks. "Pendler til jobb, bensin under 150k"'],
  da: ['Skriv f.eks. "Familie med to børn, stort bagagerum"'],
  fi: ['Kirjoita esim. "Perheauto, automaattivaihteisto"'],
};

const WRITE_OWN: Record<string, string> = {
  sv: 'Skriv eget svar',
  en: 'Write your own',
  no: 'Skriv eget svar',
  da: 'Skriv eget svar',
  fi: 'Kirjoita oma vastaus',
};

const SEND_LABEL: Record<string, string> = {
  sv: 'Skicka',
  en: 'Send',
  no: 'Send',
  da: 'Send',
  fi: 'Lähetä',
};

const AND_WORD: Record<string, string> = {
  sv: 'och',
  en: 'and',
  no: 'og',
  da: 'og',
  fi: 'ja',
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
  const [messages, setMessages] = useState<ChatMessage[]>(savedChat?.messages || [GREETINGS.sv()]);
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
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const [visibleText, setVisibleText] = useState<Record<string, string>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  // Förifylld fråga från guide-sidorna (/?q=...). Fyller bara i fältet — användaren
  // skickar själv. Parametern rensas ur adressfältet efteråt.
  useEffect(() => {
    let prefill: string | null = null;
    try {
      prefill = new URLSearchParams(window.location.search).get('q');
    } catch {}
    if (!prefill) return;
    setInputValue(prefill.slice(0, 500));
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {}
    requestAnimationFrame(() => {
      document
        .querySelector('[data-search-section]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);


  // Rotate placeholder examples every 3.5s while idle on first message
  useEffect(() => {
    if (messages.length > 1 || inputFocused || inputValue) return;
    const examples = PLACEHOLDER_EXAMPLES[language] || PLACEHOLDER_EXAMPLES.sv;
    if (examples.length <= 1) return;
    const t = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % examples.length);
    }, 3500);
    return () => clearInterval(t);
  }, [language, messages.length, inputFocused, inputValue]);

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

      const target = Math.max(0, liveContainer.scrollHeight - liveContainer.clientHeight);
      targetScrollTopRef.current = target;

      if (force || isTypingRef.current) {
        stopScrollLoop();
        liveContainer.scrollTop = target;
        setShowScrollDown(false);

        requestAnimationFrame(() => {
          const settledContainer = chatContainerRef.current;
          if (!settledContainer) return;
          settledContainer.scrollTop = Math.max(0, settledContainer.scrollHeight - settledContainer.clientHeight);
        });
        return;
      }

      startScrollLoop();
    });
  }, [startScrollLoop, stopScrollLoop]);

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

  // Auto-resize textarea when inputValue changes (voice or clear) — cache last height.
  // Keep all follow-scroll inside the Clutch chat, never by moving the page.
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
      queueScrollToBottom(true);
    });
  }, [inputValue, queueScrollToBottom]);

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

  // When the last assistant message has suggestion chips, align the message's
  // TOP into view so the user can read it from the beginning (otherwise the
  // chips + input push the message scroll-area down and only the tail shows).
  useEffect(() => {
    if (!isMobile) return;
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant?.suggestions?.length) return;
    const container = chatContainerRef.current;
    const target = lastMessageRef.current;
    if (!container || !target) return;
    const t = setTimeout(() => {
      const top = target.offsetTop - 8;
      container.scrollTo({ top, behavior: 'smooth' });
    }, 120);
    return () => clearTimeout(t);
  }, [messages, isMobile, visibleText]);

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

  // Show a reassuring note if a request takes unusually long (busy periods)
  const [slowNotice, setSlowNotice] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setSlowNotice(false);
      return;
    }
    const t = setTimeout(() => setSlowNotice(true), 10000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Follow the typewriter all the way down so the latest words stay visible.
  useEffect(() => {
    queueScrollToBottom(true);
  }, [visibleText, queueScrollToBottom]);

  // When the "thinking" indicator appears, make sure it's fully visible.
  useEffect(() => {
    if (showTypingDots) {
      isAutoFollowRef.current = true;
      queueScrollToBottom(true);
    }
  }, [showTypingDots, queueScrollToBottom]);

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
      if ('.!?…'.includes(char) && (nextChar === ' ' || nextChar === '')) return 38;
      if (',;:'.includes(char) && nextChar === ' ') return 18;
      return 0; // batch within frame
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
      // Reveal a chunk of characters per frame for smoother, less laggy typing.
      // Stop early if we hit punctuation that warrants a pause.
      const CHARS_PER_FRAME = 3;
      let pauseDelay = 0;
      for (let n = 0; n < CHARS_PER_FRAME && i < fullText.length; n++) {
        i += 1;
        const currentChar = fullText[i - 1] || '';
        const nextChar = fullText[i] || '';
        const d = getCharDelay(currentChar, nextChar);
        if (d > 0) { pauseDelay = d; break; }
      }
      scheduleCommit();

      if (i < fullText.length) {
        typingTimeoutRef.current = setTimeout(tick, pauseDelay > 0 ? pauseDelay : 16);
      } else {
        // Final flush
        if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
        setVisibleText((prev) => ({ ...prev, [msgId]: fullText }));
        isTypingRef.current = false;
        queueScrollToBottom(true);
        onDone?.();
      }
    };

    typingTimeoutRef.current = setTimeout(tick, 120);
  };
  const addAssistantMessage = (
    content: string,
    suggestions?: string[],
    onDone?: () => void,
    multiSelect?: boolean,
  ) => {
    const id = Date.now().toString() + Math.random();
    const msg: ChatMessage = { id, role: 'assistant', content, suggestions, multiSelect };
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

  // ---- Sammanfattningskort ----------------------------------------------
  // Visar de filter Clutch tolkat innan sökningen körs. Kunden kan ta bort
  // enskilda krav och sedan trycka "Sök nu" — inget nytt AI-anrop behövs.
  const applySearchResult = (data: any) => {
    setIsLoading(false);

    if (data.cars?.length > 0) {
      setPhase('results');
      const resultMsg = data.message || `Jag hittade ${data.cars.length} perfekta matchningar!`;
      onResults(data.cars, resultMsg, data.carReasons || [], false, data.relaxations || []);
      setTimeout(() => {
        onScrollToResults?.();
      }, 600);
    } else {
      setPhase('chatting');
      addAssistantMessage(
        data.message || 'Tyvärr hittade jag inga bilar som matchar just nu.',
        data.suggestions || [],
      );
    }
  };

  const runConfirmedSearch = async (msgId: string, confirm: ConfirmData) => {
    if (isLoading) return;
    navigator.vibrate?.(10);
    // Kortet ska inte kunna skickas två gånger
    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, confirm: undefined } : m)));
    setIsLoading(true);

    const filters = confirm.filters || {};
    try {
      if ((filters as any).driverAge) {
        sessionStorage.setItem('findcar-driver-age', JSON.stringify((filters as any).driverAge));
      }
      sessionStorage.setItem('findcar-last-filters', JSON.stringify({
        filters,
        customerProfile: confirm.customerProfile || '',
      }));
    } catch {}

    setPhase('searching');
    addAssistantMessage('Perfekt, nu söker jag igenom tusentals bilar åt dig...');

    try {
      const { data, error } = await supabase.functions.invoke('guided-search', {
        body: {
          action: 'confirmed_search',
          filters,
          customerProfile: confirm.customerProfile || '',
          language,
        },
      });
      if (error) throw error;

      try {
        sessionStorage.setItem('findcar-user-profile', JSON.stringify({
          age: data?.userAge ?? null,
          city: data?.userCity ?? null,
        }));
      } catch {}

      applySearchResult(data || {});
    } catch (err) {
      console.error('Confirmed search error:', err);
      setPhase('chatting');
      setIsLoading(false);
      addAssistantMessage('Oj, något gick fel med sökningen. Försök igen!', ['Försök igen']);
    }
  };

  const removeConfirmFilter = (msgId: string, key: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.confirm) return m;
        const next = { ...m.confirm.filters };
        delete next[key];
        return { ...m, confirm: { ...m.confirm, filters: next } };
      }),
    );
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
        addAssistantMessage(
          data.message,
          data.suggestions,
          undefined,
          data.multiSelect === true || inferMultiSelect(data.message, data.suggestions),
        );

        setIsLoading(false);
      } else if (data?.action === 'confirm') {
        // Visa sammanfattningskort — kunden bekräftar innan vi söker
        const id = Date.now().toString() + Math.random();
        const content = data.message || 'Här är vad jag letar efter. Ser det rätt ut?';
        setMessages((prev) => [
          ...prev,
          {
            id,
            role: 'assistant',
            content,
            confirm: {
              filters: (data.filters ?? {}) as Record<string, unknown>,
              customerProfile: data.customerProfile || '',
            },
          },
        ]);
        typewriteMessage(id, content);
        setIsLoading(false);
      } else if (data?.action === 'search') {
        if (data.filters?.driverAge) {
          sessionStorage.setItem('findcar-driver-age', JSON.stringify(data.filters.driverAge));
        }
        try {
          sessionStorage.setItem('findcar-last-filters', JSON.stringify({
            filters: data.filters ?? {},
            customerProfile: data.customerProfile || '',
          }));
        } catch {}
        setPhase('searching');

        try {
          sessionStorage.setItem('findcar-user-profile', JSON.stringify({
            age: data.userAge ?? null,
            city: data.userCity ?? null,
          }));
        } catch {}

        applySearchResult(data);

      } else {
        addAssistantMessage(data?.message || 'Något gick fel. Försök igen!');
        setIsLoading(false);
      }
    } catch (err: unknown) {
      console.error('Guided search error:', err);
      const status = (err as { context?: { status?: number } })?.context?.status;
      if (status === 429) {
        addAssistantMessage(
          'Du har gjort dina 30 kostnadsfria AI-sökningar för idag. Kom tillbaka imorgon så hjälper jag dig hitta rätt bil!',
          []
        );
        setIsLoading(false);
        return;
      }
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
    setMessages([(GREETINGS[l] || GREETINGS.sv)()]);
    setPhase('chatting');
    setInputValue('');
    setVisibleText({});
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
    sessionStorage.removeItem('findcar-search-state');
    sessionStorage.removeItem('findcar-results-revealed');
    sessionStorage.removeItem('findcar-driver-age');
    sessionStorage.removeItem('findcar-last-filters');
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
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto">
      <div
        className={`clutch-shell overflow-hidden border border-border/50 flex flex-col ${
          inputFocused ? 'is-focused' : ''
        } ${
          isMobile && mobileExpanded
            ? 'rounded-2xl'
            : 'rounded-2xl md:rounded-3xl'
        }`}
        style={{ height: isMobile ? 'min(82svh, calc(100dvh - 110px))' : '500px' }}
      >
        {/* Header */}
        <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4 lg:py-5 border-b border-border/30 flex items-center justify-between shrink-0 sticky top-0 z-20 bg-card/85 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="clutch-avatar w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center">
                <Sparkles className="h-4 w-4 md:h-[18px] md:w-[18px] text-primary-foreground" />
              </div>
              <span className="online-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-card" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-[15px] md:text-base tracking-tight text-foreground">Clutch</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Om Clutch"
                      className="text-muted-foreground/70 hover:text-foreground transition-colors rounded-full p-0.5 -m-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="start"
                    sideOffset={8}
                    collisionPadding={12}
                    className="w-[min(18rem,calc(100vw-24px))] p-3.5 text-[12.5px] md:text-[13px] leading-relaxed bg-card/95 backdrop-blur-md border-border/60 shadow-lg"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="clutch-avatar w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      </div>
                      <p className="font-semibold text-foreground">Möt Clutch</p>
                    </div>
                    <p className="text-muted-foreground">
                      Clutch är din personliga AI-bilrådgivare på FindCar. Namnet hyllar kopplingen i bilen — den som förenar föraren med maskinen.
                    </p>
                    <p className="text-muted-foreground mt-1.5">
                      På samma sätt kopplar Clutch ihop dig med rätt bil.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              aria-label="Language"
              className="text-[11px] bg-background/60 border border-border/40 rounded-lg px-2 py-1.5 text-muted-foreground hover:text-foreground cursor-pointer outline-none focus:border-primary/40 transition-colors"
            >
              <option value="sv">🇸🇪 SV</option>
              <option value="en">🇬🇧 EN</option>
              <option value="no">🇳🇴 NO</option>
              <option value="da">🇩🇰 DA</option>
              <option value="fi">🇫🇮 FI</option>
            </select>
            <button
              onClick={() => handleReset()}
              className="h-[30px] w-[30px] flex items-center justify-center border border-border/40 rounded-lg bg-background/60 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title={RESTART[language] || RESTART.sv}
              aria-label={RESTART[language] || RESTART.sv}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Chat area — scroll is contained here */}
        <div
          ref={chatContainerRef}
          className="relative px-4 md:px-6 lg:px-8 py-4 space-y-3 overflow-y-auto overscroll-contain chat-scrollbar pb-8 flex-1 min-h-0"
        >
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1;
            const alreadyAnimated = animatedMsgIdsRef.current.has(msg.id);
            if (isLast && !alreadyAnimated) {
              animatedMsgIdsRef.current.add(msg.id);
            }
            const animClass = !alreadyAnimated
              ? msg.role === 'user' ? 'whoosh-in' : 'bubble-in'
              : '';
            const chips = msg.confirm ? filterChips(msg.confirm.filters) : [];
            return (
              <div key={msg.id}>
              <div
                ref={isLast ? lastMessageRef : undefined}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'} ${animClass}`}
              >
                {msg.role === 'assistant' && (
                  <div className="clutch-avatar w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl px-4 py-3 text-[15px] md:text-sm lg:text-[15px] leading-relaxed overflow-hidden ${
                    msg.role === 'user'
                      ? 'bubble-user text-secondary-foreground rounded-br-md'
                      : 'bubble-assistant text-foreground rounded-bl-md'
                  }`}
                >
                  {getDisplayText(msg)}
                  {isTypingMsg(msg) && (
                    <span className="inline-block w-0.5 h-3.5 bg-foreground/40 ml-0.5 animate-pulse align-text-bottom" />
                  )}
                </div>
              </div>

              {/* Sammanfattningskort innan sökning */}
              {msg.confirm && (
                <div className="mt-2 ml-9 max-w-[85%] md:max-w-[78%] rounded-2xl border border-border/60 bg-card/70 p-3.5">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Din sökning</p>
                  {chips.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {chips.map((chip) => (
                        <span
                          key={chip.key}
                          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-xs text-foreground"
                        >
                          {chip.label}
                          <button
                            type="button"
                            aria-label={`Ta bort ${chip.label}`}
                            onClick={() => removeConfirmFilter(msg.id, chip.key)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Inga specifika krav – jag visar ett brett urval.</p>
                  )}
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => runConfirmedSearch(msg.id, msg.confirm!)}
                    className="mt-3 w-full rounded-xl bg-gradient-to-br from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                  >
                    Sök nu
                  </button>
                </div>
              )}
              </div>
            );

          })}

          {isLoading && phase === 'searching' && <SearchAnimation />}
          {showTypingDots && (
            <div className="flex justify-start gap-2 bubble-in pl-1 pr-2">
              <div className="clutch-avatar w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ml-1 avatar-thinking">
                <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="bubble-assistant rounded-2xl rounded-bl-md px-4 py-3.5">
                <div className="flex items-end gap-1.5 h-3">
                  <span className="wave-dot" style={{ animationDelay: '0ms' }} />
                  <span className="wave-dot" style={{ animationDelay: '140ms' }} />
                  <span className="wave-dot" style={{ animationDelay: '280ms' }} />
                </div>
              </div>
            </div>
          )}

          {isLoading && slowNotice && (
            <p className="pl-10 pr-2 text-xs text-muted-foreground bubble-in">
              Det tar lite längre tid än vanligt just nu – hänger kvar…
            </p>
          )}

          {/* Scroll-to-bottom button */}
          {showScrollDown && (
            <button
              onClick={() => {
                isAutoFollowRef.current = true;
                queueScrollToBottom(true);
              }}
              aria-label="Scroll to latest"
              className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground border border-primary/30 shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block' }}
            >
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick-reply suggestions */}
        {showSuggestions && (
          <SuggestionsRow
            key={lastAssistantMsg?.id}
            suggestions={lastAssistantMsg?.suggestions}
            multiSelect={lastAssistantMsg?.multiSelect}
            priceMode={isPriceQuestion(lastAssistantMsg?.content, lastAssistantMsg?.suggestions)}

            onPick={handleSuggestionClick}
            onWriteOwn={() => inputRef.current?.focus()}
            writeOwnLabel={WRITE_OWN[language] || WRITE_OWN.sv}
            sendLabel={SEND_LABEL[language] || SEND_LABEL.sv}
            andWord={AND_WORD[language] || AND_WORD.sv}
          />
        )}

        {/* Results CTA + Reset */}
        {phase === 'results' && !isLoading && (
          <div className="px-4 md:px-6 lg:px-8 pb-4 space-y-2 shrink-0">
            {onScrollToResults && (
              <Button
                variant="gradient"
                size="default"
                onClick={() => { onScrollToResults?.(); }}
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
        <div
          className="px-4 md:px-6 lg:px-8 pb-5 pt-3 border-t border-border/40 shrink-0 bg-gradient-to-b from-card/40 to-card/80 backdrop-blur-sm safe-pb rounded-none"
        >
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div
              className={`clutch-input-shell flex-1 relative rounded-2xl border transition-all duration-200 ${
                isListening
                  ? 'border-primary/60 ring-2 ring-primary/25 shadow-[0_0_0_4px_hsl(var(--primary)/0.08)]'
                  : inputFocused
                    ? 'border-primary/50 ring-2 ring-primary/15 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.35)]'
                    : 'border-border/50 shadow-[0_2px_10px_-4px_hsl(var(--secondary)/0.12)] hover:border-border/70'
              }`}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder={isListening
                  ? (language === 'en' ? 'Listening...' : 'Lyssnar...')
                  : (messages.length <= 1 && !inputFocused
                      ? (PLACEHOLDER_EXAMPLES[language] || PLACEHOLDER_EXAMPLES.sv)[placeholderIndex % (PLACEHOLDER_EXAMPLES[language] || PLACEHOLDER_EXAMPLES.sv).length]
                      : (PLACEHOLDERS[language] || PLACEHOLDERS.sv))}
                disabled={isLoading}
                rows={1}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                name="clutch-chat-input"
                inputMode="text"
                enterKeyHint="send"
                className="field-sizing-content w-full resize-none bg-transparent px-4 py-3.5 md:py-3 text-[16px] md:text-sm outline-none ring-0 border-0 shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 placeholder:text-muted-foreground/60 dark:placeholder:text-foreground/50 disabled:opacity-50 max-h-[140px] overflow-y-auto leading-relaxed"
                style={{ minHeight: '48px', fontSize: 'max(16px, 1rem)' }}
              />
            </div>
            {speechSupported && (
              <button
                type="button"
                onClick={() => { navigator.vibrate?.(10); toggleListening(); }}
                disabled={isLoading}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                className={`relative h-11 w-11 rounded-2xl shrink-0 flex items-center justify-center transition-all duration-200 border ${
                  isListening
                    ? 'bg-primary/15 border-primary/50 text-primary mic-listening'
                    : 'border-border/50 bg-background/70 text-muted-foreground dark:text-foreground/75 hover:text-foreground dark:hover:text-foreground hover:border-primary/50 hover:bg-background hover:scale-[1.03] active:scale-95'
                } disabled:opacity-50`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send"
              className={`h-11 w-11 rounded-2xl shrink-0 transition-all duration-200 border ${
                inputValue.trim() && !isLoading
                  ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:scale-105 active:scale-95 shadow-[0_6px_20px_-6px_hsl(var(--primary)/0.55)] hover:shadow-[0_8px_24px_-6px_hsl(var(--primary)/0.7)] border-primary/30'
                  : 'bg-muted text-muted-foreground/60 dark:bg-muted/60 dark:text-foreground/55 border-border/40'
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ---------- Memoized suggestions row (prevents re-render during typewriter) ---------- */

type SuggestionsRowProps = {
  suggestions?: string[];
  multiSelect?: boolean;
  priceMode?: boolean;
  onPick: (s: string) => void;
  onWriteOwn: () => void;
  writeOwnLabel: string;
  sendLabel: string;
  andWord: string;
};

const SuggestionsRow = memo(function SuggestionsRow({
  suggestions,
  multiSelect,
  priceMode,
  onPick,
  onWriteOwn,
  writeOwnLabel,
  sendLabel,
  andWord,
}: SuggestionsRowProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [showSlider, setShowSlider] = useState(false);
  const [range, setRange] = useState<[number, number]>([100000, 250000]);

  const toggle = (s: string) => {
    navigator.vibrate?.(10);
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const sendSelected = () => {
    if (!selected.length) return;
    let text: string;
    if (selected.length === 1) text = selected[0];
    else if (selected.length === 2) text = `${selected[0]} ${andWord} ${selected[1]}`;
    else text = `${selected.slice(0, -1).join(', ')} ${andWord} ${selected[selected.length - 1]}`;
    setSelected([]);
    onPick(text);
  };

  /** Prisreglage — visas som alternativ vid budgetfrågor. */
  const priceSliderBlock = priceMode ? (
    showSlider ? (
      <div className="mt-2 w-full rounded-2xl border border-border/60 bg-card/60 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-xs text-muted-foreground">Dra för att välja budget</span>
          <span className="text-sm font-semibold text-foreground">
            {formatSek(range[0])} – {formatSek(range[1])}
          </span>
        </div>
        <Slider
          value={range}
          min={20000}
          max={1000000}
          step={10000}
          onValueChange={(v) => setRange([v[0], v[1]] as [number, number])}
          aria-label="Prisintervall"
        />
        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
          <span>20 000 kr</span>
          <span>1 000 000 kr</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              navigator.vibrate?.(10);
              setShowSlider(false);
              onPick(`Min budget är ${formatSek(range[0])} till ${formatSek(range[1])}`);
            }}
            className="flex-1 rounded-xl bg-gradient-to-br from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.01] active:scale-[0.99]"
          >
            {sendLabel}
          </button>
          <button
            onClick={() => setShowSlider(false)}
            className="rounded-xl border border-border/60 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Avbryt
          </button>
        </div>
      </div>
    ) : (
      <button
        onClick={() => { navigator.vibrate?.(10); setShowSlider(true); }}
        className="chip-in inline-flex items-center gap-1.5 text-[13px] md:text-sm font-medium px-3.5 md:px-4 py-2 md:py-2.5 rounded-full border border-border/60 bg-gradient-to-b from-background to-muted/40 hover:from-primary/10 hover:to-primary/5 hover:border-primary/50 text-foreground/90 hover:text-foreground transition-all duration-200 active:scale-[0.97] shadow-sm"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Välj pris själv
      </button>
    )
  ) : null;


  if (multiSelect) {
    return (
      <div className="px-3 md:px-6 lg:px-8 pb-3 pt-1 shrink-0">
        <div className="flex flex-wrap gap-2 items-center">
          {suggestions?.map((s, i) => {
            const active = selected.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggle(s)}
                className={`chip-in inline-flex items-center gap-1.5 text-[13px] md:text-sm font-medium px-3.5 md:px-4 py-2 md:py-2.5 rounded-full border transition-all duration-200 active:scale-[0.97] shadow-sm ${
                  active
                    ? 'border-primary/60 bg-primary/15 text-foreground shadow-md'
                    : 'border-border/60 bg-gradient-to-b from-background to-muted/40 hover:from-primary/10 hover:to-primary/5 hover:border-primary/50 text-foreground/90 hover:text-foreground hover:shadow-md'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {active && <Check className="h-3.5 w-3.5" />}
                {s}
              </button>
            );
          })}
          <button
            onClick={onWriteOwn}
            className="chip-in inline-flex items-center gap-1.5 text-[13px] md:text-sm font-medium px-3.5 md:px-4 py-2 md:py-2.5 rounded-full border border-dashed border-border/60 dark:border-foreground/30 bg-transparent hover:bg-accent/60 hover:border-primary/40 text-muted-foreground dark:text-foreground/80 hover:text-foreground dark:hover:text-foreground transition-all duration-200 active:scale-[0.97]"
            style={{ animationDelay: `${(suggestions?.length || 0) * 50}ms` }}
          >
            <PenLine className="h-3.5 w-3.5" />
            {writeOwnLabel}
          </button>
          {selected.length > 0 && (
            <button
              onClick={sendSelected}
              className="chip-in inline-flex items-center gap-1.5 text-[13px] md:text-sm font-semibold px-3.5 md:px-4 py-2 md:py-2.5 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground border border-primary/30 shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.55)] hover:scale-[1.03] active:scale-95 transition-all duration-200"
            >
              <Send className="h-3.5 w-3.5" />
              {sendLabel} ({selected.length})
            </button>
          )}
          {priceSliderBlock}
        </div>

      </div>
    );
  }

  return (
    <div className="px-3 md:px-6 lg:px-8 pb-3 pt-1 shrink-0">
      <div className="flex flex-wrap gap-2 items-center">
        {suggestions?.map((s, i) => (
          <button
            key={s}
            onClick={() => { navigator.vibrate?.(10); onPick(s); }}
            className="chip-in group relative text-[13px] md:text-sm font-medium px-3.5 md:px-4 py-2 md:py-2.5 rounded-full border border-border/60 bg-gradient-to-b from-background to-muted/40 hover:from-primary/10 hover:to-primary/5 hover:border-primary/50 text-foreground/90 hover:text-foreground transition-all duration-200 active:scale-[0.97] shadow-sm hover:shadow-md"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            {s}
          </button>
        ))}
        <button
          onClick={onWriteOwn}
          className="chip-in inline-flex items-center gap-1.5 text-[13px] md:text-sm font-medium px-3.5 md:px-4 py-2 md:py-2.5 rounded-full border border-dashed border-border/60 dark:border-foreground/30 bg-transparent hover:bg-accent/60 hover:border-primary/40 text-muted-foreground dark:text-foreground/80 hover:text-foreground dark:hover:text-foreground transition-all duration-200 active:scale-[0.97]"
          style={{ animationDelay: `${(suggestions?.length || 0) * 50}ms` }}
        >
          <PenLine className="h-3.5 w-3.5" />
          {writeOwnLabel}
        </button>
      </div>
    </div>
  );
});
