import { useEffect, useState } from "react";
import { Ban, Clock, Fuel, Presentation as GasStation, X } from "lucide-react";
import { AddPriceEntry } from "../components/AddPriceEntry";
import { useNavigate } from "react-router-dom";
// import Authentication from "../components/Authentication";
import { supabase } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";

interface FuelStation {
  id: number;
  name: string;
  location: string;
  petrol_price: number;
  diesel_price: number;
  last_updated: string;
  effective_date?: string;
}

const mockAuthState = {
  isAuthenticated: true,
  isAdmin: true,
};

export default function HomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<FuelStation[]>([]);

  const [sortBy, setSortBy] = useState<"petrol" | "diesel">("petrol");
  const [showAddForm, setShowAddForm] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // ✅ Check if the user is already logged in
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();

    // ✅ Listen for changes in authentication state
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
    navigate("/login");
  };

  const fetchData = async () => {
    const { data } = await supabase.from("fuel_stations").select();
    if (data) {
      setData([...data].sort((a, b) => a.petrol_price - b.petrol_price));
    }
  };

  const filteredData = data.filter(
    (station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchData(); // Initial data load
  }, []);

  const handleSort = (type: "petrol" | "diesel") => {
    setSortBy(type);
    setData((prevData) =>
      [...prevData].sort((a, b) =>
        type === "petrol"
          ? a.petrol_price - b.petrol_price
          : a.diesel_price - b.diesel_price
      )
    );
  };

  const handleNewEntry = (newEntry: FuelStation) => {
    setData((prevData) => [...prevData, newEntry]); // UI me turant add karein
    setShowAddForm(false); // Modal band kar dein
  };
  console.log(user, "<=== user");

  console.log(fetchData, "<=== fetchData");
  console.log(data, "<=== data");

  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GasStation className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                Lagos Fuel Price Tracker
              </h1>
            </div>
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-5 justify-between">
<div className="flex gap-4 w-full max-w-4xl">

            <input
              type="text"
              placeholder="Search by station name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg shadow-lg max-w-lg p-2 border"
            />

              <button
                onClick={() => handleSort("petrol")}
                className={`px-4 py-2 rounded-md ${
                  sortBy === "petrol"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sort by Petrol
              </button>
              <button
                onClick={() => handleSort("diesel")}
                className={`px-4 py-2 rounded-md ${
                  sortBy === "diesel"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sort by Diesel
              </button>
            </div>
        {user && (

            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add New Entry
            </button>
        )}
          </div>
        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {showAddForm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add New Entry</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-800"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <AddPriceEntry
                  closeModal={() => setShowAddForm(false)}
                  onSuccess={handleNewEntry}
                />
              </div>
            </div>
          )}
          {filteredData.length > 0 && (
            filteredData.map((station) => (
              <div
                key={station.id}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {station.name}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {station.location}
                    </p>
                  </div>
                  <Fuel className="h-6 w-6 text-blue-500" />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center bg-gray-100 rounded-lg px-4 py-2">
                    <span className="text-gray-600 font-medium">Petrol</span>
                    <span className="text-lg font-bold text-green-600">
                      ₦{station.petrol_price}/L
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-100 rounded-lg px-4 py-2">
                    <span className="text-gray-600 font-medium">Diesel</span>
                    <span className="text-lg font-bold text-red-600">
                      ₦{station.diesel_price}/L
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  Last updated:{" "}
                  {station.effective_date
                    ? new Date(station.effective_date).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            ))
          ) }
        </div>
        {!filteredData.length && (
            <div className="flex flex-col justify-center items-center h-screen w-full">
            <Ban className="text-gray-400 w-12 h-12 mb-2" />
            <p className="text-center text-gray-500 text-lg">No stations found.</p>
          </div>
          )}
      </main>
    </div>
  );
}
