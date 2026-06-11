import { Suspense, lazy } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientOnly } from "@/components/ClientOnly";
import { SentryErrorFallback } from "@/components/SentryErrorFallback";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Cases from "./pages/Cases";
import Entities from "./pages/Entities";
import About from "./pages/About";
import Commitment from "./pages/Commitment";
import OurProcess from "./pages/OurProcess";
import OurTeam from "./pages/OurTeam";
import Volunteer from "./pages/Volunteer";
import OurProducts from "./pages/OurProducts";
import Information from "./pages/Information";
import CaseDetail from "./pages/CaseDetail";
import EntityProfile from "./pages/EntityProfile";
import EntityResponse from "./pages/EntityResponse";
import ModerationDashboard from "./pages/ModerationDashboard";
import Feedback from "./pages/Feedback";
import Updates from "./pages/Updates";
import UpdateDetail from "./pages/UpdateDetail";
import EmbedCaseCard from "./pages/EmbedCaseCard";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";
import ArchiveSearch from "./pages/ArchiveSearch";
import NotFound from "./pages/NotFound";
import { ScrollToTop } from "@/components/ScrollToTop";

const GuestChat = lazy(() => import("./pages/GuestChat"));

const RouteLoadingFallback = () => (
  <div
    className="flex min-h-screen items-center justify-center px-4"
    role="status"
    aria-live="polite"
  >
    <span className="text-sm text-muted-foreground">Loading...</span>
  </div>
);

const App = () => (
  <Sentry.ErrorBoundary fallback={({ error, resetError }) => <SentryErrorFallback error={error} resetError={resetError} />}>
    <TooltipProvider>
      <ClientOnly>
        <Toaster />
        <Sonner />
      </ClientOnly>
      <Suspense fallback={<RouteLoadingFallback />}>
        <ScrollToTop />
        <Routes>
          {/* Embed route for oEmbed iframe */}
          <Route path="/embed/case/:id" element={<EmbedCaseCard />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/case/:id" element={<CaseDetail />} />
            <Route path="/entities" element={<Entities />} />
            <Route path="/search" element={<ArchiveSearch />} />
            <Route path="/entity/:id" element={<EntityProfile />} />
            <Route path="/ask" element={<GuestChat />} />
            <Route path="/entity-response/:id" element={<EntityResponse />} />
            <Route path="/moderation" element={<ModerationDashboard />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/updates/:id" element={<UpdateDetail />} />
            <Route path="/information" element={<Information />} />
            <Route path="/about" element={<About />} />
            <Route path="/commitment" element={<Commitment />} />
            <Route path="/our-process" element={<OurProcess />} />
            <Route path="/team" element={<OurTeam />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/products" element={<OurProducts />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<TermsOfService />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </TooltipProvider>
  </Sentry.ErrorBoundary>
);

export default App;
