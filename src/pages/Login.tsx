import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { boolean } from "zod";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
      await supabase.auth.signOut();
  
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
  
    if (error) {
      console.error("❌ Login Error:", error);
      setError(error.message || "Invalid credentials.");
      return;
    }
  
    const user = data.user;
    if (!user) {
      setError("Login failed: No user data received.");
      return;
    }
  
    console.log("✅ Logged-in User ID:", user.id);
  
    // ✅ Ensure the profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
  
    if (profileError) {
      console.error("❌ Profile Error:", profileError);
      setError("Profile not found.");
      return;
    }
  
    console.log("✅ Profile Found:", profile);
  
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userId", user.id);
    window.location.href = "/";
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Login</h2>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email:</label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div >
            <label className="block text-gray-700">Password:</label>
          <div className="relative">
            
            <input
              type={`${showPassword ? 'text' : 'password'}`}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
                            type="button"
                            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>

        {/* <p className="text-center text-gray-600 mt-4">
          Don't have an account?
          <span
            className="text-blue-500 cursor-pointer hover:underline"
            onClick={() => navigate("/signup")}
          > Sign Up</span>
        </p> */}
      </div>
    </div>
  );
}
