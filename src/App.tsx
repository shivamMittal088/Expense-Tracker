import { BrowserRouter } from "react-router-dom";
import { Routes, Route } from "react-router-dom";
import Layout from "./Components/Layout";
import HomePage from "./Components/HomePage";
import Analytics from "./Components/Analytics";
import Profile from "./Components/Profile";
import Login from "./Components/Login";

const App:React.FC = ()=> {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout/>} >
          <Route index element={<HomePage />} />
          <Route path="/Analytics" element={<Analytics/>} />
          <Route path="/Profile" element={<Profile/>} />
          <Route path="/login" element={<Login />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
