import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SearchAnimation } from './SearchAnimation';
import { Send, Sparkles, RotateCcw, ArrowRight } from 'lucide-react';

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

type Step = 'greeting' | 'useCase' | 'budget' | 'fuel' | 'bodyType' | 'searching' | 'results';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  options?: ChatOption[];
  multiSelect?: boolean;
};

type ChatOption = {
  label: string;
  value: string;
};

type SearchContext = {
  useCase?: string;
  budget?: string;
  fuel?: string[];
  bodyType?: string[];
  freeText?: string;
};

const STEPS: Record<string, { message: string; options: ChatOption[]; multiSelect?: boolean }> = {
  useCase: {
    message: 'Vad ska bilen främst användas till?',
    options: [
      { label: '🚗 Pendling', value: 'pendling' },
      { label: '👨‍👩‍👧‍👦 Familj', value: 'familj' },
      { label: '🛣️ Långresa', value: 'langresa' },
      { label: '🏙️ Stadskörning', value: 'stad' },
      { label: '🔄 Blandat', value: 'blandat' },
    ],
  },
  budget: {
    message: 'Bra val! 💰 Vilken budget har du?',
    options: [
      { label: 'Under 150 000 kr', value: '0-150000' },
      { label: '150 – 250 000 kr', value: '150000-250000' },
      { label: '250 – 350 000 kr', value: '250000-350000' },
      { label: '350 – 500 000 kr', value: '350000-500000' },
      { label: 'Över 500 000 kr', value: '500000-9999999' },
    ],
  },
  fuel: {
    message: '⛽ Vilken drivlina föredrar du? Du kan välja flera.',
    multiSelect: true,
    options: [
      { label: '⚡ El', value: 'el' },
      { label: '🔌 Laddhybrid', value: 'laddhybrid' },
      { label: '🔋 Hybrid', value: 'hybrid' },
      { label: '⛽ Bensin', value: 'bensin' },
      { label: '🛢️ Diesel', value: 'diesel' },
    ],
  },
  bodyType: {
    message: '🚙 Sista frågan! Vilken karosstyp? Välj en eller flera.',
    multiSelect: true,
    options: [
      { label: '🚙 SUV', value: 'suv' },
      { label: '🚗 Kombi', value: 'kombi' },
      { label: '🏎️ Sedan', value: 'sedan' },
      { label: '🚘 Halvkombi', value: 'halvkombi' },
      { label: '🏁 Coupé', value: 'coupe' },
    ],
  },
};

const _STEP_ORDER: Step[] = ['useCase', 'budget', 'fuel', 'bodyType'];

const SUGGESTIONS = [
  'Bor i Småland, pendlar 8 mil/dag, budget 250k',
  'Familj med 3 barn, behöver plats och säkerhet',
  'Elbil för stadskörning, max 300 000 kr',
  'Bekväm långkörare för tjänsteresor',
];

interface GuidedSearchProps {
  onResults: (cars: Car[], message: string) => void;
}

const getNextStep = (ctx: SearchContext): Step => {
  if (!ctx.useCase) return 'useCase';
  if (!ctx.budget) return 'budget';
  if (!ctx.fuel || ctx.fuel.length === 0) return 'fuel';
  if (!ctx.bodyType || ctx.bodyType.length === 0) return 'bodyType';
  return 'searching';
};

export const GuidedSearch = ({ onResults }: GuidedSearchProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hej! 👋 Jag är Clutch — din objektiva bilrådgivare. Berätta om din situation så hittar jag den perfekta bilen åt dig. Var bor du? Hur långt pendlar du? Vilken budget har du? Ju mer jag vet, desto bättre kan jag hjälpa dig.',
    },
  ]);
  const [currentStep, setCurrentStep] = useState<Step>('greeting');
  const [context, setContext] = useState<SearchContext>({});
  const [isLoading, setIsLoading] = useState(false);
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = (msg: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now().toString() + Math.random() }]);
  };

  const showNextStep = (newContext: SearchContext) => {
    const nextStep = getNextStep(newContext);
    if (nextStep === 'searching') {
      performSearch(newContext);
    } else {
      setCurrentStep(nextStep);
      const stepConfig = STEPS[nextStep];
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: stepConfig.message,
          options: stepConfig.options,
          multiSelect: stepConfig.multiSelect,
        });
      }, 300);
    }
  };

  const handleSuggestion = (text: string) => {
    setInputValue('');
    addMessage({ role: 'user', content: text });
    performSearch({ freeText: text });
  };

  const handleSingleSelect = (option: ChatOption) => {
    const newContext = { ...context };
    if (currentStep === 'useCase') newContext.useCase = option.value;
    else if (currentStep === 'budget') newContext.budget = option.value;
    setContext(newContext);
    addMessage({ role: 'user', content: option.label });
    showNextStep(newContext);
  };

  const handleMultiToggle = (value: string) => {
    setMultiSelections((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleMultiConfirm = () => {
    if (multiSelections.length === 0) return;
    const newContext = { ...context };
    const labels = multiSelections.map(
      (v) => STEPS[currentStep]?.options.find((o) => o.value === v)?.label || v
    );

    if (currentStep === 'fuel') newContext.fuel = multiSelections;
    else if (currentStep === 'bodyType') newContext.bodyType = multiSelections;

    setContext(newContext);
    setMultiSelections([]);
    addMessage({ role: 'user', content: labels.join(', ') });
    showNextStep(newContext);
  };

  const handleSendMessage = (e?: FormEvent) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isLoading) return;
    setInputValue('');
    addMessage({ role: 'user', content: text });

    // If we're in guided mode, try to interpret as a step answer
    // Otherwise treat as free-text search
    if (currentStep === 'greeting' || currentStep === 'results') {
      performSearch({ ...context, freeText: text });
    } else {
      // In guided mode, still allow free text to override
      performSearch({ ...context, freeText: text });
    }
  };

  const handleStartGuided = () => {
    const newContext = { ...context };
    showNextStep(newContext);
  };

  const performSearch = async (searchContext: SearchContext) => {
    setCurrentStep('searching');
    setIsLoading(true);
    addMessage({ role: 'assistant', content: '🔍 Clutch söker efter din perfekta bil...' });

    try {
      const { data, error } = await supabase.functions.invoke('guided-search', {
        body: { context: searchContext },
      });

      if (error) throw error;
      setCurrentStep('results');

      if (data?.cars?.length > 0) {
        addMessage({
          role: 'assistant',
          content: data.message || `Jag hittade ${data.cars.length} bilar!`,
        });
        onResults(data.cars, data.message || `Hittade ${data.cars.length} bilar`);
      } else {
        addMessage({
          role: 'assistant',
          content: '😔 Tyvärr hittade jag inga bilar som matchar just nu. Prova att beskriva vad du söker på ett annat sätt!',
        });
      }
    } catch (e) {
      console.error('Search error:', e);
      addMessage({ role: 'assistant', content: '❌ Något gick fel. Försök igen!' });
      setCurrentStep('results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Hej igen! 👋 Beskriv din drömbil, eller starta en guidad sökning.',
      },
    ]);
    setCurrentStep('greeting');
    setContext({});
    setMultiSelections([]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const lastMessage = messages[messages.length - 1];
  const showSuggestions = currentStep === 'greeting' && messages.length <= 1;

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
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
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

          {isLoading && <SearchAnimation />}
          <div ref={chatEndRef} />
        </div>

        {/* Guided options (shown when in step mode) */}
        {!isLoading && currentStep !== 'results' && currentStep !== 'greeting' && currentStep !== 'searching' && (
          <div className="px-4 md:px-5 pb-3 space-y-3">
            {lastMessage?.options && !lastMessage.multiSelect && (
              <div className="flex flex-wrap gap-2">
                {lastMessage.options.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="outline"
                    size="sm"
                    className="rounded-full touch-target hover:bg-accent/60 hover:border-primary/30 transition-all"
                    onClick={() => handleSingleSelect(opt)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}

            {lastMessage?.multiSelect && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {lastMessage.options?.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={multiSelections.includes(opt.value) ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full touch-target transition-all"
                      onClick={() => handleMultiToggle(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {multiSelections.length > 0 && (
                  <Button onClick={handleMultiConfirm} size="sm" className="w-full rounded-xl">
                    <Send className="h-4 w-4 mr-2" />
                    Fortsätt ({multiSelections.length} valda)
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Suggestions (only on first greeting) */}
        {showSuggestions && (
          <div className="px-4 md:px-5 pb-3 space-y-3">
            <p className="text-xs text-muted-foreground font-medium">Prova att fråga:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-border/50 bg-accent/30 hover:bg-accent/60 hover:border-primary/30 text-foreground transition-all duration-200 flex items-center gap-2 group"
                >
                  <ArrowRight className="h-3 w-3 text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all shrink-0" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-border/50" />
              <span className="text-xs text-muted-foreground">eller</span>
              <div className="h-px flex-1 bg-border/50" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartGuided}
              className="w-full rounded-xl hover:bg-accent/60"
            >
              Guidad sökning steg-för-steg
            </Button>
          </div>
        )}

        {/* Results actions */}
        {currentStep === 'results' && !isLoading && (
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
                placeholder="Beskriv din drömbil..."
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
