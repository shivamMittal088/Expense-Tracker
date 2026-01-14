import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../Components/Api";

const ProtectedRoute = ()=> {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    api.get("/api/auth/me")
      .then(() => setAuth(true))
      .catch(() => setAuth(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Checking session...</div>;

  return auth ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
