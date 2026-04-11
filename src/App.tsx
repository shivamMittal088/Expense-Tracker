import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Layout from "./Components/Layout";
import HomePage from "./Components/HomePage";
const Analytics = lazy(() => import("./Components/Analytics"));
const Transactions = lazy(() => import("./Components/Transactions"));
const Profile = lazy(() => import("./Components/Profile"));
const Settings = lazy(() => import("./Components/Settings"));
const Login = lazy(() => import("./Components/Login"));
const HelpFAQ = lazy(() => import("./Components/HelpFAQ"));
const ExportExcelPage = lazy(() => import("./Components/ExportExcelPage"));
import ProtectedRoute from "./routeWrapper/ProtectedRoute";

const App: React.FC = () => {
  const routeFallback = (
    <div className="min-h-screen bg-black flex items-start justify-center px-4 pt-6">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
    </div>
  );

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Suspense fallback={routeFallback}><Login /></Suspense>} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="analytics" element={<Suspense fallback={routeFallback}><Analytics /></Suspense>} />
              <Route path="transactions" element={<Suspense fallback={routeFallback}><Transactions /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={routeFallback}><Profile /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={routeFallback}><Settings /></Suspense>} />
              <Route path="help" element={<Suspense fallback={routeFallback}><HelpFAQ /></Suspense>} />
              <Route path="exports" element={<Suspense fallback={routeFallback}><ExportExcelPage /></Suspense>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
