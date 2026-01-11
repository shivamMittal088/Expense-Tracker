import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

const Layout:React.FC = ()=> {
  return (
    <>
      <NavBar />

      {/* Prevent content hiding under fixed navbar */}
      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
};

export default Layout;
