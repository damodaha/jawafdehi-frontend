import { useCaseworkAuth } from "@/context/CaseworkAuthContext";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";

const CaseworkLogin = () => {
  const { login, loading, error } = useCaseworkAuth();

  const handleSignIn = () => {
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="flex justify-center mb-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Casework Portal</h1>
        </div>

        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button
            onClick={handleSignIn}
            variant="default"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In with Zitadel"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaseworkLogin;
