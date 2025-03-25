import { supabase } from "../../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userId");
    navigate("/login"); // Redirect to login page
  };

  return (
    <button 
      onClick={handleLogout} 
      className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
}
