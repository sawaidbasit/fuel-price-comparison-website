import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Login from "./pages/Login";
// import SignUp from "./pages/SignUp";
import LogoutButton from "./pages/Logout";
import StationList from "./components/StationList";
import AdminPanel from "./pages/AdminPanel";
import UserSubmissionForm from "./components/UserSubmissionForm";
import PrivateRoute from "./components/PrivateRoute";

// Public routes function
const getPublicRoutes = () => (
  <>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/logout" element={<LogoutButton />} />
    <Route path="/stations/:stateName" element={<StationList />} />
    <Route path="/submit" element={<UserSubmissionForm />} />
  </>
);

// Private routes function
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
    <Route
      path="/login"
      element={
        <PrivateRoute>
          <Login />
        </PrivateRoute>
      }
    />
  </>
);

export default function AppRoutes() {


  return (
    // <Router>
    //     <Routes>
    //       <Route path="/" element={<HomePage />} />
    //       <Route path="/login" element={<Login/>} />
    //       <Route path="/logout" element={<LogoutButton />} />
    //       <Route path="/stations/:stateName" element={<StationList />} />
    //       <Route path="/admin" element={<AdminPanel />} />
    //       <Route path="/submit" element={<UserSubmissionForm/>} />
    //       <Route path="/admin" element={<AdminPanel/>}/>
    //       {/* <Route path="/signup" element={<SignUp />} /> */}
    //     </Routes>
    // </Router>
    <Router>
      <Routes>
        {getPublicRoutes()}
        {getPrivateRoutes()}
      </Routes>
    </Router>
  );
}
