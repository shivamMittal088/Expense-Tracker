import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Layout from "./Components/Layout";
import HomePage from "./Components/HomePage";
import Analytics from "./Components/Analytics";
import Transactions from "./Components/Transactions";
import Profile from "./Components/Profile";
import Settings from "./Components/Settings";
import Login from "./Components/Login";
import HelpFAQ from "./Components/HelpFAQ";
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
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<HelpFAQ />} />
              <Route
                path="exports"
                element={(
                  <Suspense fallback={routeFallback}>
                    <ExportExcelPage />
                  </Suspense>
                )}
              />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
