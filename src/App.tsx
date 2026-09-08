import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import CarDetail from "./pages/CarDetail";
import CarComparison from "./pages/CarComparison";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Admin from "./pages/Admin";
import Guides from "./pages/Guides";
import GuideArticle from "./pages/GuideArticle";
import About from "./pages/About";
import Community from "./pages/Community";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { usePageViewTracking } from "@/hooks/useAnalytics";

const queryClient = new QueryClient();

/** Räknar anonyma sidvisningar (ingen cookie, inget som pekar ut en person). */
const PageViewTracker = () => {
  usePageViewTracking();
  return null;
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <PageViewTracker />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/car/:id" element={<CarDetail />} />
            <Route path="/compare" element={<CarComparison />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/guider" element={<Guides />} />
            <Route path="/guider/:slug" element={<GuideArticle />} />
            <Route path="/om-oss" element={<About />} />
            <Route path="/admin" element={<Admin />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <FeedbackWidget />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
