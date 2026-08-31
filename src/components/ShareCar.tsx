import { Share2, Copy, Mail, MessageCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAnalytics } from '@/hooks/useAnalytics';

const BASE_URL = 'https://findcar.se';

interface ShareCarInput {
  id: number;
  make: string | null;
  model: string | null;
  year: number | null;
  price: number | null;
  mileage: number | null;
}

interface ShareCarProps {
  car: ShareCarInput;
  /** 'button' = knapp med text (bilsidan), 'icon' = kompakt ikon (bilkort) */
  variant?: 'button' | 'icon';
  className?: string;
}

const nf = new Intl.NumberFormat('sv-SE');

export const buildShareUrl = (carId: number) => `${BASE_URL}/car/${carId}`;

export const buildShareTitle = (car: ShareCarInput) => {
  const name = `${car.make || ''} ${car.model || ''}`.trim() || 'Bil';
  const parts: string[] = [];
  if (car.price) parts.push(`${nf.format(car.price)} kr`);
  if (car.year) parts.push(String(car.year));
  if (car.mileage) parts.push(`${nf.format(car.mileage)} mil`);
  return parts.length > 0 ? `${name} – ${parts.join(', ')}` : name;
};

/** Kopiera med clipboard-API, med textarea-fallback om det blockeras. */
const copyText = async (text: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* faller igenom till fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

export const ShareCar = ({ car, variant = 'button', className = '' }: ShareCarProps) => {
  const { track } = useAnalytics();
  const url = buildShareUrl(car.id);
  const title = buildShareTitle(car);
  const shareText = `${title}\n${url}`;

  const logShare = (method: string) => {
    void track('car_share', { carId: car.id, method });
  };

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, text: title, url });
      logShare('native');
      return true;
    } catch {
      // Användaren avbröt eller delning misslyckades — visa ingen felruta.
      return false;
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(url);
    if (ok) {
      toast.success('Länk kopierad');
      logShare('copy');
      navigator.vibrate?.(10);
    } else {
      toast.error('Kunde inte kopiera länken');
    }
  };

  const hasNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const trigger =
    variant === 'icon' ? (
      <button
        type="button"
        aria-label="Dela bilen"
        className={`w-12 h-12 md:w-10 md:h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background active:scale-95 transition-all touch-target ${className}`}
      >
        <Share2 className="h-[18px] w-[18px] text-muted-foreground hover:text-primary transition-colors" />
      </button>
    ) : (
      <Button variant="ghost" className={className}>
        <Share2 className="h-4 w-4 mr-2" />
        Dela
      </Button>
    );

  // På mobil: öppna telefonens egen delningsmeny direkt.
  if (hasNative) {
    return (
      <span
        onClick={(e) => {
          stop(e);
          void nativeShare();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            stop(e);
            void nativeShare();
          }
        }}
        className="inline-flex"
      >
        {trigger}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={stop}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" onClick={stop}>
        <DropdownMenuItem onClick={() => void handleCopy()}>
          <Copy className="h-4 w-4 mr-2" />
          Kopiera länk
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText)}`}
            onClick={() => logShare('email')}
          >
            <Mail className="h-4 w-4 mr-2" />
            Skicka via mejl
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => logShare('whatsapp')}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Skicka via WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`sms:?&body=${encodeURIComponent(shareText)}`} onClick={() => logShare('sms')}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Skicka via SMS
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
