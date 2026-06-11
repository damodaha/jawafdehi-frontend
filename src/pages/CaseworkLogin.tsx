import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCaseworkAuth } from "@/context/CaseworkAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClipboardCheck } from "lucide-react";

const CaseworkLogin = () => {
  const { login, loading, error } = useCaseworkAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/portal/reviews");
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Casework Portal (New)</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cwrk-username" className="text-slate-900">Username</Label>
            <Input
              id="cwrk-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              required
              autoComplete="username"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cwrk-password" className="text-slate-900">Password</Label>
            <Input
              id="cwrk-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {(formError || error) && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {formError || error}
            </p>
          )}

          <Button type="submit" variant="default" className="w-full" disabled={submitting || loading}>
            {submitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CaseworkLogin;
