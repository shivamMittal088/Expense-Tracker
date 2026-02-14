import { useState } from "react";
import { Outlet} from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";
import PeopleSearchModal from "./PeopleSearchModal.tsx";

export default function Layout() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // const location = useLocation();
  // const hideUI = location.pathname === "/login";

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <NavBar onSearchClick={() => setIsSearchOpen(true)} />

      {/* This is the scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      {/* {!hideUI && <Footer />} */}
      <Footer />

      <PeopleSearchModal
        key={isSearchOpen ? "search-open" : "search-closed"}
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}