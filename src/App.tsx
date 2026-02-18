import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Layout from "./Components/Layout";
import HomePage from "./Components/HomePage";
import Analytics from "./Components/Analytics";
const AnalyticsLazy = lazy(() => import("./Components/Analytics"));
import Profile from "./Components/Profile";
const Settings = lazy(() => import("./Components/Settings"));
import Login from "./Components/Login";
import PublicProfile from "./Components/PublicProfile";
import FollowListPage from "./Components/FollowListPage";
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
              <Route
                path="analytics"
                element={(
                  <Suspense fallback={routeFallback}>
                    <AnalyticsLazy />
                  </Suspense>
                )}
              />
              <Route
                path="transactions"
                element={<Analytics mode="transactions" />}
              />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/followers" element={<FollowListPage mode="followers" />} />
              <Route path="profile/following" element={<FollowListPage mode="following" />} />
              <Route path="profile/:id" element={<PublicProfile />} />
              <Route
                path="settings"
                element={(
                  <Suspense fallback={routeFallback}>
                    <Settings />
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
