import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border">
      <div className="w-full px-5 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[13px] text-muted-foreground">
        <p>© {new Date().getFullYear()} FindCar · Framtagen på KTH</p>
        <div className="flex items-center gap-5">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Integritet</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Villkor</Link>
        </div>
      </div>
    </footer>
  );
};