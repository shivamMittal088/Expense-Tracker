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

  if (loading) return <div>Checking session...</div>;

  return auth ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
