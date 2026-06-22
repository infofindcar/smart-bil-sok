import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Linkedin, Instagram } from 'lucide-react';

export const Header = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="w-full px-5 md:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="font-display text-[17px] font-medium tracking-[-0.02em] text-foreground">
          FindCar
        </Link>
        <nav className="flex items-center gap-6 text-[14px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors hidden sm:inline">
            Sök
          </Link>
          <button
            onClick={() => setContactOpen(true)}
            className="hover:text-foreground transition-colors"
          >
            Kontakt
          </button>
        </nav>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-medium">Kontakta oss</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <a href="mailto:info@findcar.se" className="flex items-center gap-3 p-3 border border-border rounded hover:bg-muted transition-colors text-sm">
              <Mail className="h-4 w-4" />
              info@findcar.se
            </a>
            <a href="https://www.linkedin.com/company/findcar-se" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-border rounded hover:bg-muted transition-colors text-sm">
              <Linkedin className="h-4 w-4" />
              FindCar på LinkedIn
            </a>
            <a href="https://instagram.com/findcar.se" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 border border-border rounded hover:bg-muted transition-colors text-sm">
              <Instagram className="h-4 w-4" />
              @findcar.se
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};