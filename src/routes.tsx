import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AddEntry from "./pages/AddEntry";
import LogoutButton from "./pages/Logout";

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add-entry" element={<AddEntry />} />
        <Route path="/login" element={<Login/>} />
        <Route path="/logout" element={<LogoutButton />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}
