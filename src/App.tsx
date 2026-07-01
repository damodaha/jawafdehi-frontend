import { Suspense, lazy, type ReactNode } from "react";
import * as Sentry from "@sentry/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientOnly } from "@/components/ClientOnly";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { SentryErrorFallback } from "@/components/SentryErrorFallback";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import WeeklyMeetings from "./pages/WeeklyMeetings";
import Information from "./pages/Information";
import CaseDetail from "./pages/CaseDetail";
import EntityProfile from "./pages/EntityProfile";
import NesEntityProfile from "./pages/NesEntityProfile";
import MaterialProfile from "./pages/MaterialProfile";
import CourtCaseProfile from "./pages/CourtCaseProfile";
import EntityResponse from "./pages/EntityResponse";
import ModerationDashboard from "./pages/ModerationDashboard";
import Feedback from "./pages/Feedback";
import Updates from "./pages/Updates";
import UpdateDetail from "./pages/UpdateDetail";
import UpdatePreview from "./pages/UpdatePreview";
import EmbedCaseCard from "./pages/EmbedCaseCard";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";
import ArchiveSearch from "./pages/ArchiveSearch";
import Materials from "./pages/Materials";
import CourtCases from "./pages/CourtCases";
import NotFound from "./pages/NotFound";
import { ScrollToTop } from "@/components/ScrollToTop";
// Unified admin panel — mounted at /admin (folds in the old /portal casework).
import { AuthProvider } from "react-oidc-context";
import { getUserManager, onSigninCallback } from "./services/oidc";
import { CaseworkAuthProvider } from "./context/CaseworkAuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import NesEntities from "./pages/admin/nes/NesEntities";
import NesEntityCreate from "./pages/admin/nes/NesEntityCreate";
import NesEntityEdit from "./pages/admin/nes/NesEntityEdit";
import NgmCourtCases from "./pages/admin/ngm/NgmCourtCases";
import NgmCourtCaseForm from "./pages/admin/ngm/NgmCourtCaseForm";
import NgmMaterials from "./pages/admin/ngm/NgmMaterials";
import NgmMaterialForm from "./pages/admin/ngm/NgmMaterialForm";
import NgmCourts from "./pages/admin/ngm/NgmCourts";
import NgmCourtForm from "./pages/admin/ngm/NgmCourtForm";
import NgmFirms from "./pages/admin/ngm/NgmFirms";
import NgmFirmForm from "./pages/admin/ngm/NgmFirmForm";
import AdminCases from "./pages/admin/jawafdehi/AdminCases";
import AdminCaseForm from "./pages/admin/jawafdehi/AdminCaseForm";
import Moderation from "./pages/admin/casework/Moderation";
import CaseworkLogin from "./pages/CaseworkLogin";
import CaseworkCallback from "./pages/CaseworkCallback";
import CaseworkReviews from "./pages/CaseworkReviews";
import CaseworkReviewDetail from "./pages/CaseworkReviewDetail";
import CaseworkRules from "./pages/CaseworkRules";
import CaseworkHow from "./pages/CaseworkHow";

const GuestChat = lazy(() => import("./pages/GuestChat"));
const Donate = lazy(() => import("./pages/Donate"));
const DataQuality = lazy(() => import("./pages/DataQuality"));

// Wraps the portal in the OIDC AuthProvider. Built as a component (not a spread
// of a config object) so the UserManager is only constructed when this renders
// — under <ClientOnly>, i.e. on the client after hydration, never during SSR.
const PortalAuthProvider = ({ children }: { children: ReactNode }) => (
  <AuthProvider userManager={getUserManager()} onSigninCallback={onSigninCallback}>
    {children}
  </AuthProvider>
);

// Back-compat redirect: /portal/<rest> -> /admin/<rest> (preserving query).
const PortalRedirect = () => {
  const location = useLocation();
  const dest =
    location.pathname.replace(/^\/portal/, "/admin") + location.search;
  return <Navigate to={dest} replace />;
};

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
        <CookieConsentBanner />
      </ClientOnly>
      <Suspense fallback={<RouteLoadingFallback />}>
        <ScrollToTop />
        <Routes>
          {/* Embed route for oEmbed iframe */}
          <Route path="/embed/case/:id" element={<EmbedCaseCard />} />

          {/* Unified admin panel — standalone full-screen, mounted at /admin.
              Folds in the former /portal casework pages. Auth: OIDC + an
              internal role (gated by AdminLayout). login/callback sit OUTSIDE
              AdminLayout so the auth gate doesn't bounce the entry points. */}
          <Route
            path="/admin/*"
            element={
              <ClientOnly>
                <PortalAuthProvider>
                  <CaseworkAuthProvider>
                    <Routes>
                      <Route path="login" element={<CaseworkLogin />} />
                      <Route path="callback" element={<CaseworkCallback />} />
                      <Route element={<AdminLayout />}>
                        <Route path="" element={<AdminDashboard />} />
                        {/* NES — create/edit before the list so the literal
                            "new" and "edit" segments win over the splat. */}
                        <Route path="nes/entities/new" element={<NesEntityCreate />} />
                        <Route path="nes/entities/edit/*" element={<NesEntityEdit />} />
                        <Route path="nes/entities" element={<NesEntities />} />
                        {/* NGM */}
                        <Route path="ngm/courtcases/new" element={<NgmCourtCaseForm />} />
                        <Route
                          path="ngm/courtcases/:court/:caseNumber/edit"
                          element={<NgmCourtCaseForm />}
                        />
                        <Route path="ngm/courtcases" element={<NgmCourtCases />} />
                        <Route path="ngm/courts/new" element={<NgmCourtForm />} />
                        <Route
                          path="ngm/courts/:identifier/edit"
                          element={<NgmCourtForm />}
                        />
                        <Route path="ngm/courts" element={<NgmCourts />} />
                        <Route path="ngm/firms/new" element={<NgmFirmForm />} />
                        <Route path="ngm/firms/:id/edit" element={<NgmFirmForm />} />
                        <Route path="ngm/firms" element={<NgmFirms />} />
                        <Route path="ngm/materials/new" element={<NgmMaterialForm />} />
                        <Route path="ngm/materials/edit/*" element={<NgmMaterialForm />} />
                        <Route path="ngm/materials" element={<NgmMaterials />} />
                        {/* Jawafdehi — create/edit before the list so the
                            literal "new" segment wins over the :slug/:id param. */}
                        <Route path="jawafdehi/cases/new" element={<AdminCaseForm />} />
                        <Route
                          path="jawafdehi/cases/:slug/edit"
                          element={<AdminCaseForm />}
                        />
                        <Route path="jawafdehi/cases" element={<AdminCases />} />
                        {/* Document Sources removed: the "cases own no documents"
                            ADR collapsed sources into NGM Materials, so there is no
                            /api/sources/ write endpoint. Evidence is linked as
                            material IRIs on the case; manage docs under NGM →
                            Materials. */}
                        {/* Casework (folded in from /portal) */}
                        <Route path="reviews" element={<CaseworkReviews />} />
                        <Route path="reviews/:id" element={<CaseworkReviewDetail />} />
                        <Route path="rules" element={<CaseworkRules />} />
                        <Route path="how" element={<CaseworkHow />} />
                        <Route path="moderation" element={<Moderation />} />
                      </Route>
                    </Routes>
                  </CaseworkAuthProvider>
                </PortalAuthProvider>
              </ClientOnly>
            }
          />

          {/* Back-compat: the casework portal moved from /portal to /admin. */}
          <Route path="/portal/*" element={<PortalRedirect />} />

          <Route element={<AppLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/case/:id" element={<CaseDetail />} />
            <Route path="/entities" element={<Entities />} />
            <Route path="/search" element={<ArchiveSearch />} />
            {/* NGM single-type browse pages (unified-archive search, type-pinned). */}
            <Route path="/materials" element={<Materials />} />
            <Route path="/courtcases" element={<CourtCases />} />
            {/* Legacy Jawafdehi case-entity profile (numeric id, single segment). */}
            <Route path="/entity/:id" element={<EntityProfile />} />
            {/* NES entity by IRI tail (multi-segment, e.g. organization/.../tu).
                React Router prefers the more specific :id route for single-segment
                numeric ids, so this splat only catches the hierarchical NES IRIs. */}
            <Route path="/entity/*" element={<NesEntityProfile />} />
            {/* NGM governance material by IRI tail (/material/<source>/<ident>). */}
            <Route path="/material/*" element={<MaterialProfile />} />
            {/* NGM court case by IRI tail (/courtcase/<court>/<case_number>). */}
            <Route path="/courtcase/*" element={<CourtCaseProfile />} />
            <Route path="/ask" element={<GuestChat />} />
            <Route path="/entity-response/:id" element={<EntityResponse />} />
            <Route path="/moderation" element={<ModerationDashboard />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/updates" element={<Updates />} />
            {/* Wagtail headless preview target — must precede the :slug route. */}
            <Route path="/updates/preview" element={<UpdatePreview />} />
            <Route path="/updates/:slug" element={<UpdateDetail />} />
            <Route path="/information" element={<Information />} />
            <Route path="/about" element={<About />} />
            <Route path="/commitment" element={<Commitment />} />
            <Route path="/data-quality" element={<DataQuality />} />
            <Route path="/our-process" element={<OurProcess />} />
            <Route path="/team" element={<OurTeam />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/products" element={<OurProducts />} />
            <Route path="/saptahik" element={<WeeklyMeetings />} />
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
