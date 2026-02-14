import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Layout from "./Components/Layout";
import HomePage from "./Components/HomePage";
import Analytics from "./Components/Analytics";
import Profile from "./Components/Profile";
import Settings from "./Components/Settings";
import Login from "./Components/Login";
import PublicProfile from "./Components/PublicProfile";
import ProtectedRoute from "./routeWrapper/ProtectedRoute";

const App: React.FC = () => {
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
              <Route path="profile" element={<Profile />} />
              <Route path="profile/:id" element={<PublicProfile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
