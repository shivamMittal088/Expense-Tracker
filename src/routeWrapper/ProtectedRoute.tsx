import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./Api";

const ProtectedRoute = ()=> {
  const hasStoredSession = localStorage.getItem("isLoggedIn") === "true";
  const [loading, setLoading] = useState(hasStoredSession);
  const [auth, setAuth] = useState(hasStoredSession);

  useEffect(() => {
    if (!hasStoredSession) {
      return;
    }

    api.get("/api/auth/me")
      .then(() => setAuth(true))
      .catch(() => setAuth(false))
      .finally(() => setLoading(false));
  }, [hasStoredSession]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-start justify-center px-4 pt-6">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400/20 border-t-emerald-400/80 animate-spin" />
      </div>
    );
  }

  return auth ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
