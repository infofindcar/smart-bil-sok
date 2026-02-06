import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { StepIndicator } from './StepIndicator';
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

const STEP_ORDER: Step[] = ['useCase', 'budget', 'fuel', 'bodyType'];

const QUICK_STARTS = [
  { label: '👨‍👩‍👧‍👦 Familjebil', context: { useCase: 'familj' } as Partial<SearchContext> },
  { label: '⚡ Elbil', context: { fuel: ['el'] } as Partial<SearchContext> },
  { label: '🚗 Pendlarbil', context: { useCase: 'pendling' } as Partial<SearchContext> },
  { label: '💰 Under 250k', context: { budget: '0-250000' } as Partial<SearchContext> },
];

const LOADING_MESSAGES = [
  'Söker bland hundratals bilar...',
  'Analyserar dina preferenser...',
  'Hittar de bästa matcherna...',
  'Nästan klart...',
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
      content: 'Hej! 👋 Jag är Clutch, din personliga bilrådgivare. Berätta vad du letar efter så hjälper jag dig hitta rätt bil!',
    },
  ]);
  const [currentStep, setCurrentStep] = useState<Step>('greeting');
  const [context, setContext] = useState<SearchContext>({});
  const [isLoading, setIsLoading] = useState(false);
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const getStepIndex = () => {
    const idx = STEP_ORDER.indexOf(currentStep as (typeof STEP_ORDER)[number]);
    return idx >= 0 ? idx : 0;
  };

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

  const handleQuickStart = (qs: (typeof QUICK_STARTS)[0]) => {
    const newContext = { ...context, ...qs.context };
    setContext(newContext);
    addMessage({ role: 'user', content: qs.label });
    showNextStep(newContext);
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

  const performSearch = async (searchContext: SearchContext) => {
    setCurrentStep('searching');
    setIsLoading(true);
    addMessage({ role: 'assistant', content: '🔍 Söker efter bilar som matchar dina önskemål...' });

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
          content: '😔 Tyvärr hittade jag inga bilar som matchar just nu. Prova att bredda din sökning!',
        });
      }
    } catch (e) {
      console.error('Search error:', e);
      addMessage({ role: 'assistant', content: '❌ Något gick fel med sökningen. Försök igen!' });
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
        content: 'Hej igen! 👋 Låt oss hitta en ny bil åt dig. Vad letar du efter?',
      },
    ]);
    setCurrentStep('greeting');
    setContext({});
    setMultiSelections([]);
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {currentStep !== 'greeting' && currentStep !== 'results' && (
        <StepIndicator current={getStepIndex() + 1} total={STEP_ORDER.length} />
      )}

      <div className="bg-card rounded-2xl shadow-warm border border-border overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Clutch AI</span>
        </div>

        {/* Chat */}
        <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto chat-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm animate-slide-up ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-chat-bubble text-foreground rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-chat-bubble rounded-2xl rounded-bl-md px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-muted-foreground text-xs">{loadingMessage}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Options */}
        {!isLoading && currentStep !== 'results' && (
          <div className="p-4 border-t border-border space-y-3">
            {currentStep === 'greeting' && (
              <div className="flex flex-wrap gap-2">
                {QUICK_STARTS.map((qs) => (
                  <Button
                    key={qs.label}
                    variant="outline"
                    size="sm"
                    className="rounded-full touch-target hover-lift"
                    onClick={() => handleQuickStart(qs)}
                  >
                    {qs.label}
                  </Button>
                ))}
              </div>
            )}

            {lastMessage?.options && !lastMessage.multiSelect && (
              <div className="flex flex-wrap gap-2">
                {lastMessage.options.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="outline"
                    size="sm"
                    className="rounded-full touch-target hover-lift"
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
                      className="rounded-full touch-target"
                      onClick={() => handleMultiToggle(opt.value)}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
                {multiSelections.length > 0 && (
                  <Button onClick={handleMultiConfirm} size="sm" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Fortsätt ({multiSelections.length} valda)
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 'results' && (
          <div className="p-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Ny sökning
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
