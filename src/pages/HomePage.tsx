import { useEffect, useState } from "react";
import { Ban, Clock, Fuel, Presentation as GasStation, X } from "lucide-react";
import { AddPriceEntry } from "../components/AddPriceEntry";
import { supabase } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import PetrolTable from "../components/PetrolTable";
import DieselTable from "../components/DieselTable";
import KeroseneTable from "../components/KeroseneTable";

interface FuelStation {
  id: number;
  station_name: string;
  station_location: string;
  fuel_type: "petrol" | "diesel" | "kerosene";
  price: number;
  tags: [];
  last_updated: string;
  effective_date?: string;
}

const mockAuthState = {
  isAuthenticated: true,
  isAdmin: true,
};

export default function HomePage() {
  const [sortBy, setSortBy] = useState<"petrol" | "diesel">("petrol");
  const [showAddForm, setShowAddForm] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [petrolData, setPetrolData] = useState<FuelStation[]>([]);
  const [dieselData, setDieselData] = useState<FuelStation[]>([]);
  const [keroseneData, setKeroseneData] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(false);

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

const fetchData = async () => {
  setLoading(true);

  const { data: petrolData, error: petrolError } = await supabase
    .from("petrol_prices")
    .select();
  const { data: dieselData, error: dieselError } = await supabase
    .from("diesel_prices")
    .select();
  const { data: keroseneData, error: keroseneError } = await supabase
    .from("kerosene_prices")
    .select();

  if (petrolError || dieselError || keroseneError) {
    console.error("Error fetching data:", petrolError || dieselError || keroseneError);
    setLoading(false);
    return;
  }

  setPetrolData(petrolData || []);
  setDieselData(dieselData || []);
  setKeroseneData(keroseneData || []);
  
  setLoading(false);
};

  const handleSearch = (query: string) => {
  setSearchQuery(query);
  setLoading(true);

  setTimeout(() => {
    setLoading(false);
  }, 500);
};

const filteredPetrol = petrolData.filter(station =>
  station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  station.station_location.toLowerCase().includes(searchQuery.toLowerCase())
);

const filteredDiesel = dieselData.filter(station =>
  station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  station.station_location.toLowerCase().includes(searchQuery.toLowerCase())
);

const filteredKerosene = keroseneData.filter(station =>
  station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  station.station_location.toLowerCase().includes(searchQuery.toLowerCase())
);


  useEffect(() => {
    fetchData();
  }, []);


  const handleNewEntry = (newEntry: FuelStation) => {
    if (newEntry.fuel_type === "petrol") {
        setPetrolData((prevData) => {
            const newData = [...prevData, newEntry];
            console.log("Updated Petrol Data:", newData);
            return newData;
        });
    } else if (newEntry.fuel_type === "diesel") {
        setDieselData((prevData) => {
            const newData = [...prevData, newEntry];
            console.log("Updated Diesel Data:", newData);
            return newData;
        });
    } else if (newEntry.fuel_type === "kerosene") {
        setKeroseneData((prevData) => {
            const newData = [...prevData, newEntry];
            console.log("Updated Kerosene Data:", newData);
            return newData;
        });
    }

    setShowAddForm(false);
    fetchData()
};

  
  return (
    <div>
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Fuel className="h-10 w-10 text-green-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                Lagos Fuel Price Tracker
              </h1>
            </div>
            {
              user && (
                <button
                  onClick={handleLogout}
                  className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              )
            
            }
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-5 justify-between items-center">
          <div className="w-full max-w-4xl">
            <input
              type="text"
              placeholder="Search by station name or location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg shadow-lg max-w-lg p-2 border"
            />

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
        <div className="mt-10 gap-y-44 md:gap-y-32 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {showAddForm && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
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
            <PetrolTable data={filteredPetrol} loading={loading}/>
          <DieselTable data={filteredDiesel} loading={loading}/>
          <KeroseneTable data={filteredKerosene} loading={loading}/>
        </div>
      </main>
    </div>
  );
}
