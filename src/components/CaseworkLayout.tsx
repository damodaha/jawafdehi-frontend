import { ReactNode } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { useCaseworkAuth } from "@/context/CaseworkAuthContext";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, LogOut } from "lucide-react";

const NAV = [
  { to: "/portal/reviews", label: "Reviews" },
  { to: "/portal/rules", label: "Rules" },
  { to: "/portal/how", label: "How it works" },
];

export default function CaseworkLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useCaseworkAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  // Auth guard: the SPA only runs over an authenticated endpoint.
  if (!user) {
    return <Navigate to="/portal/login" replace state={{ from: location.pathname }} />;
  }

  const onLogout = () => {
    logout();
    navigate("/portal/login");
  };

  // Role gate: mirror the API's read-access roles (CanReadReview). A signed-in
  // user without any of these can't use the portal, so show a clear message
  // instead of letting them in to hit 403s on every call.
  const READ_ACCESS_ROLES = [
    "admin",
    "moderator",
    "contributor",
    "readonly",
    "review_assistant",
  ];
  const hasAccess = (user.roles ?? []).some((r) =>
    READ_ACCESS_ROLES.includes(r.toLowerCase()),
  );
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-slate-900">No portal access</h1>
          <p className="text-sm text-slate-600">
            Your account ({user.username}) doesn&apos;t have a role that grants access
            to the Casework portal. Ask an admin to grant you a role, then sign in again.
          </p>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/portal/reviews" className="flex items-center gap-2 font-semibold">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Casework Portal (New)
            </Link>
            <nav className="flex items-center gap-1">
              {NAV.map((n) => {
                const active = location.pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`px-3 py-1.5 rounded-md text-sm ${
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-slate-100"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.username}
              {user.roles?.length ? (
                <span className="ml-1 text-xs text-slate-400">({user.roles.join(", ")})</span>
              ) : null}
            </span>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
