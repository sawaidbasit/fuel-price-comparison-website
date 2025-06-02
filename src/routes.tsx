import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
// import SignUp from "./pages/SignUp";
import LogoutButton from "./pages/Logout";
import StationList from "./components/StationList";
import AdminPanel from "./pages/AdminPanel";
import UserSubmissionForm from "./components/UserSubmissionForm";
import PrivateRoute from "./components/PrivateRoute";
import Layout from "./components/layout";
import FillingStations from "./pages/fillingStations";

// Public routes function
const getPublicRoutes = () => (
  <>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/logout" element={<LogoutButton />} />
    <Route path="/stations/:stateName" element={<StationList />} />
    <Route path="/fillingStations" element={<FillingStations />} />
    <Route path="/submit" element={<UserSubmissionForm />} />
  </>
);

const getPrivateRoutes = () => (
  <>
    <Route
      path="/admin"
      element={
        <PrivateRoute>
          <AdminPanel />
        </PrivateRoute>
      }
    />
  </>
);

export default function AppRoutes() {


  return (
    <Router>
      <Layout>
        <Routes>
        {getPublicRoutes()}
        {getPrivateRoutes()}
      </Routes>
      </Layout>
    </Router>
  );
}
