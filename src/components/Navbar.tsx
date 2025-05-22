import { User } from "@supabase/supabase-js";
import { Fuel } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

export default function Navbar() {
      const [user, setUser] = useState<User | null>(null);
      const location = useLocation(); // Get current route
      useEffect(() => {
          const checkAuth = async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
          };
          checkAuth();
      
          const { data: authListener } = supabase.auth.onAuthStateChange(
            (_, session) => {
              setUser(session?.user || null);
            }
          );
      
          return () => {
            authListener.subscription.unsubscribe();
          };
        }, []);
      
        const handleLogout = async () => {
          await supabase.auth.signOut();
          setUser(null);
        };
    return (
    <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link to={"/"}>
            <div className="flex items-center cursor-pointer" >
              <Fuel className="h-10 w-10 text-green-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                Lagos Fuel Price Tracker
              </h1>
            </div>
            </Link>
            {user && (
              <div className="flex gap-5">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
                <Link to={"/admin"} className={`${location.pathname === "/admin" ? "hidden" : ""}`}>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Manage Stations
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
    )
}