import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

const ProtectedRoute = ()=> {
  const auth = useAppSelector((state) => state.user.isAuthenticated);

  return auth ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
