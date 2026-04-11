import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { useAppSelector } from "./store/hooks";
import Layout from "./Components/Layout";
import PWAUpdatePrompt from "./Components/PWAUpdatePrompt";
import HomePage from "./Components/HomePage";
const Analytics = lazy(() => import("./Components/Analytics"));
const Transactions = lazy(() => import("./Components/Transactions"));
const Profile = lazy(() => import("./Components/Profile"));
const Settings = lazy(() => import("./Components/Settings"));
const Login = lazy(() => import("./Components/Login"));
const HelpFAQ = lazy(() => import("./Components/HelpFAQ"));
const ExportExcelPage = lazy(() => import("./Components/ExportExcelPage"));
import ProtectedRoute from "./routeWrapper/ProtectedRoute";

function ThemeSync() {
  const theme = useAppSelector((state) => state.theme.theme);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    root.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#000000" : "#f5f5f5");
  }, [theme]);
  return null;
}

const App: React.FC = () => {
  const routeFallback = (
    <div className="min-h-screen bg-black flex items-start justify-center px-4 pt-6">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-300/25 border-t-emerald-300 animate-spin shadow-[0_0_14px_rgba(52,211,153,0.35)]" />
    </div>
  );

  return (
    <Provider store={store}>
      <ThemeSync />
      <PWAUpdatePrompt />
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
