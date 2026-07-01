import { ReactNode } from "react";
import {
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useCaseworkAuth } from "@/context/CaseworkAuthContext";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ClipboardCheck,
  FileText,
  Gavel,
  LayoutDashboard,
  LogOut,
  Network,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

// The unified admin panel mounts at /admin (folds in the old /portal casework
// pages). Auth: OIDC + an internal role. The API is the authorization
// authority; this gate just keeps role-less users out of a UI that would 403
// on every call.
const ADMIN_ROLES = ["admin", "moderator", "caseworker", "contributor", "readonly"];

// Sidebar groups. `roles` (when set) narrows a link to those roles; links
// without it show for anyone who cleared the panel gate.
interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  roles?: string[];
}
interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    heading: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    heading: "NES — Entities",
    items: [{ to: "/admin/nes/entities", label: "Entities", icon: Network }],
  },
  {
    heading: "NGM — Governance",
    items: [
      { to: "/admin/ngm/courtcases", label: "Court cases", icon: Gavel },
      { to: "/admin/ngm/courts", label: "Courts", icon: Building2 },
      { to: "/admin/ngm/firms", label: "Blocklisted firms", icon: Building2 },
      { to: "/admin/ngm/materials", label: "Materials", icon: ScrollText },
    ],
  },
  {
    heading: "Jawafdehi — Cases",
    items: [
      { to: "/admin/jawafdehi/cases", label: "Cases", icon: FileText },
    ],
  },
  {
    heading: "Casework",
    items: [
      { to: "/admin/reviews", label: "Reviews", icon: ClipboardCheck },
      { to: "/admin/rules", label: "Rules", icon: ScrollText },
      {
        to: "/admin/moderation",
        label: "Moderation",
        icon: ShieldCheck,
        roles: ["admin", "moderator"],
      },
    ],
  },
];

function Sidebar({ roles }: { roles: string[] }) {
  const lower = roles.map((r) => r.toLowerCase());
  return (
    <nav className="flex flex-col gap-5 p-4">
      {NAV.map((group) => {
        const visible = group.items.filter(
          (it) => !it.roles || it.roles.some((r) => lower.includes(r)),
        );
        if (!visible.length) return null;
        return (
          <div key={group.heading} className="space-y-1">
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.heading}
            </p>
            {visible.map((it) => {
              const Icon = it.icon;
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-slate-100"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {it.label}
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

// Shell wrapper. Used directly by AdminLayout (route element) — the page body
// renders through <Outlet/>.
function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useCaseworkAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  // Auth guard.
  if (!user) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  // Role gate.
  const roles = user.roles ?? [];
  const hasAccess = roles.some((r) => ADMIN_ROLES.includes(r.toLowerCase()));
  if (!hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-slate-900">No admin access</h1>
          <p className="text-sm text-slate-600">
            Your account ({user.username}) doesn&apos;t have a role that grants
            access to the admin panel. Ask an admin to grant you a role, then
            sign in again.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
          >
            <LogOut className="mr-1 h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Jawafdehi Admin
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user.username}
              {roles.length ? (
                <span className="ml-1 text-xs text-slate-400">
                  ({roles.join(", ")})
                </span>
              ) : null}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate("/admin/login");
              }}
            >
              <LogOut className="mr-1 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r bg-white md:block">
          <Sidebar roles={roles} />
        </aside>
        <main className="min-w-0 flex-1 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
