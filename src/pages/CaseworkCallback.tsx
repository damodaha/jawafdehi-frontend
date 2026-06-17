import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

const CaseworkCallback = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isLoading) return;
    if (auth.isAuthenticated) {
      navigate("/portal/reviews", { replace: true });
    } else if (auth.error) {
      navigate("/portal/login", { replace: true });
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.error, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="text-slate-600">
            {auth.error ? "Sign-in failed. Redirecting…" : "Signing you in…"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CaseworkCallback;
