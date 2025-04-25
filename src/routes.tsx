import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
// import SignUp from "./pages/SignUp";
import LogoutButton from "./pages/Logout";
import StationList from "./components/StationList";

export default function AppRoutes() {
  return (
    <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login/>} />
          <Route path="/logout" element={<LogoutButton />} />
          <Route path="/stations/:stateName" element={<StationList />} />
          {/* <Route path="/signup" element={<SignUp />} /> */}
        </Routes>
    </Router>
  );
}
