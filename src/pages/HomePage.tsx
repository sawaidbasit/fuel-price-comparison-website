import { useEffect, useState } from "react";
import {
  Ban,
  Clock,
  Fuel,
  Presentation as GasStation,
  SearchX,
  X,
} from "lucide-react";
import { AddPriceEntry } from "../components/AddPriceEntry";
import { supabase } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import PetrolTable from "../components/PetrolTable";
import DieselTable from "../components/DieselTable";
import KeroseneTable from "../components/KeroseneTable";
import { Link } from "react-router-dom";

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

export default function HomePage() {
  const [showAddForm, setShowAddForm] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [petrolData, setPetrolData] = useState<FuelStation[]>([]);
  const [dieselData, setDieselData] = useState<FuelStation[]>([]);
  const [keroseneData, setKeroseneData] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [StationLoading, setStationLoading] = useState(false);

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

  const fetchData = async () => {
    setLoading(true);

    const tables = ["petrol_prices", "diesel_prices", "kerosene_prices"];
    const fetchPromises = tables.map((table) =>
      supabase
        .from(table)
        .select()
        .then((response) => ({
          table,
          data: response.data,
          error: response.error,
        }))
    );

    try {
      const responses = await Promise.all(fetchPromises);

      responses.forEach(({ table, data, error }) => {
        if (error) {
          console.error(`Error fetching ${table} data:`, error);
        } else {
          if (table === "petrol_prices") setPetrolData(data || []);
          if (table === "diesel_prices") setDieselData(data || []);
          if (table === "kerosene_prices") setKeroseneData(data || []);
        }
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setStationLoading(true);

    setTimeout(() => {
      setStationLoading(false);
    }, 500);
  };

  const filteredPetrol = petrolData.filter(
    (station) =>
      station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.station_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDiesel = dieselData.filter(
    (station) =>
      station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.station_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredKerosene = keroseneData.filter(
    (station) =>
      station.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.station_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  const handleNewEntry = (newEntry: FuelStation) => {
    const fuelTypeMapping = {
      petrol: setPetrolData,
      diesel: setDieselData,
      kerosene: setKeroseneData,
    };

    const setData = fuelTypeMapping[newEntry.fuel_type];

    if (setData) {
      setData((prevData) => {
        const newData = [...prevData, newEntry];
        return newData;
      });
    }

    setShowAddForm(false);
    fetchData();
  };

  const visibleTablesCount = [
    filteredPetrol.length,
    filteredDiesel.length,
    filteredKerosene.length,
  ].filter(Boolean).length;

  const LoadingIndicator = () => (
  <div className="mt-10 flex flex-col items-center justify-center py-12">
    <Clock className="h-12 w-12 text-gray-400 mb-4 animate-spin" />
    <h3 className="text-lg font-medium text-gray-700">Loading stations...</h3>
  </div>
);

const NoResults = ({ query, onClear }: { query: string; onClear: () => void }) => (
  <div className="mt-10 flex flex-col items-center justify-center py-12">
    <SearchX className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
    <p className="text-gray-500">Your search for "{query}" didn't match any fuel stations.</p>
    <button
      onClick={onClear}
      className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
    >
      Clear search
    </button>
  </div>
);

const NoStations = ({ onAdd }: { onAdd: () => void }) => (
  <div className="text-center py-12">
    <div className="mx-auto w-24 h-24 flex items-center justify-center">
      <SearchX className="h-16 w-16 text-gray-400 mb-4" />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">No stations found</h3>
    <p className="text-gray-500 mb-6">
      There are currently no fuel stations in our database.
    </p>
    <button
      onClick={onAdd}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      Add Your First Station
    </button>
  </div>
);

const NoData = () => (
  <div className="mt-10 flex flex-col items-center justify-center py-12">
    <Ban className="h-16 w-16 text-gray-400 mb-4" />
    <h3 className="text-xl font-medium text-gray-900 mb-2">No stations available</h3>
    <p className="text-gray-500">There are currently no fuel stations in the database.</p>
  </div>
);

  return (
    <div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex max-md:flex-col gap-5 justify-between items-center">
          <div className="w-full max-w-4xl">
            <input
              type="text"
              placeholder="Search by station name or location..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-lg shadow-lg max-w-lg p-2 border"
            />
          </div>
          <div className="flex gap-5 max-md:w-full max-md:justify-between items-center pt-5">
            <Link to="/fillingStations" className="underline font-bold text-gray-900">Filling Stations</Link>
          {user ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add New Entry
            </button>
          ) : (
            <a
              href={
              "https://forms.zohopublic.com/contactekof1/form/SubmitFuelPricesDescription/formperma/5tjCI0hpbCJ3X0erXLMZuIX45kVYKxmmfA7_PPoG4bU"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Submit Fuel Prices
            </a>
          )}
          </div>
        </div>
        {loading ? (
        <LoadingIndicator />
      ) : !filteredPetrol.length && !filteredDiesel.length && !filteredKerosene.length ? (
        searchQuery ? (
          <NoResults query={searchQuery} onClear={() => handleSearch("")} />
        ) : user ? (
          <NoStations onAdd={() => setShowAddForm(true)} />
        ) : (
          <NoData />
        )
      ) : null}


        <div
          className={`
            mt-20 gap-y-44 md:gap-y-32 justify-center grid gap-4
            ${visibleTablesCount === 1 ? "grid-cols-1 " : ""}
            ${visibleTablesCount === 2 ? "grid-cols-2 max-md:grid-cols-1" : ""}
            ${
              visibleTablesCount >= 3
                ? "lg:grid-cols-3 md:grid-cols-2 max-md:grid-cols-1"
                : ""
            }
            place-items-center
          `}
        >
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
                  isAdmin={!!user}
                  userEmail={user?.email}
                />
              </div>
            </div>
          )}
          <div className={`${!filteredPetrol.length && "hidden"}`}>
            <h1 className="text-3xl text-center mr-20 text-md -mt-1 font-bold text-[#616161]">
              Petrol
            </h1>
            <PetrolTable
              data={filteredPetrol.slice(0, 5)}
              loading={StationLoading}
              fullData={filteredPetrol}
            />
          </div>
          <div className={`${!filteredDiesel.length && "hidden"}`}>
            <h1 className="text-3xl text-center mr-20 text-md -mt-1 font-bold text-[#616161]">
              Diesel
            </h1>
            <DieselTable
              data={filteredDiesel.slice(0, 5)}
              loading={StationLoading}
              fullData={filteredDiesel}
            />
          </div>
          <div className={`${!filteredKerosene.length && "hidden"}`}>
            <h1 className="text-3xl text-center mr-20 text-md -mt-1 font-bold text-[#616161]">
              Kerosene
            </h1>
            <KeroseneTable
              data={filteredKerosene.slice(0, 5)}
              loading={StationLoading}
              fullData={filteredKerosene}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
