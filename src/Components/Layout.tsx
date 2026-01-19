import { Outlet} from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

export default function Layout() {
  // const location = useLocation();
  // const hideUI = location.pathname === "/login";

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar />

      {/* This is the scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* {!hideUI && <Footer />} */}
      <Footer />
    </div>
  );
}