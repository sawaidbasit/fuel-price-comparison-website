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
      // Wait for all fetch promises to resolve
      const responses = await Promise.all(fetchPromises);

      // Dynamically update state based on the response
      responses.forEach(({ table, data, error }) => {
        // console.log(table, data)
        if (error) {
          console.error(`Error fetching ${table} data:`, error);
        } else {
          // Use dynamic table-based assignment for each fuel type
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
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
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

  const mergedData = petrolData.reduce((acc, petrolItem) => {
    const existingLocation = acc.find(
      (item) => item.station_location === petrolItem.station_location
    );

    if (existingLocation) {
      // Update petrol price if newer
      if (
        new Date(petrolItem.last_updated) >
        new Date(existingLocation.last_updated)
      ) {
        existingLocation.petrolPrice = petrolItem.price;
      }
      return acc;
    }

    // Find all stations at this location (for counting)
    const allStationsAtLocation = [
      ...petrolData.filter(
        (p) => p.station_location === petrolItem.station_location
      ),
      ...dieselData.filter(
        (d) => d.station_location === petrolItem.station_location
      ),
      ...keroseneData.filter(
        (k) => k.station_location === petrolItem.station_location
      ),
    ];

    // Get unique station names
    const uniqueStations = [
      ...new Set(allStationsAtLocation.map((s) => s.station_name)),
    ];

    // Find matching diesel and kerosene prices (same as your original logic)
    const dieselItem = dieselData.find(
      (d) =>
        d.station_name === petrolItem.station_name &&
        d.station_location === petrolItem.station_location
    );

    const keroseneItem = keroseneData.find(
      (k) =>
        k.station_name === petrolItem.station_name &&
        k.station_location === petrolItem.station_location
    );

    acc.push({
      ...petrolItem,
      petrolPrice: petrolItem.price,
      dieselPrice: dieselItem?.price ?? null,
      kerosenePrice: keroseneItem?.price ?? null,
      stationCount: uniqueStations.length,
    });

    return acc;
  }, [] as any[]);

  const filteredMergedData = mergedData.filter(
    (item) =>
      item.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.station_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  console.log(mergedData, "<===");
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
            {user && (
              <div className="flex gap-5">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
                <Link to={"/admin"}>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Manage Stations
                  </button>
                </Link>
              </div>
            )}
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
          {user ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add New Entry
            </button>
          ) : (
            <a
              href={
                "https://docs.google.com/forms/d/1OjkTzr02Zf41669SYs0VSuxoY75yYX-Tp8Z0I6SoRGg/preview"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Submit Fuel Prices
            </a>
          )}
        </div>
        {/* No results state */}
        {/* {!filteredPetrol.length && !filteredDiesel.length && !filteredKerosene.length && searchQuery && (
    <div className="mt-10 flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
      <SearchX className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">No results found</h3>
      <p className="text-gray-500">
        Your search for "{searchQuery}" didn't match any fuel stations
      </p>
      <button
        onClick={() => handleSearch('')}
        className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
      >
        Clear search
      </button>
    </div>
  )} */}
        {!filteredPetrol.length &&
        !filteredDiesel.length &&
        !filteredKerosene.length ? (
          searchQuery ? (
            <div className="mt-10 flex flex-col items-center justify-center py-12 ">
              <SearchX className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-500">
                Your search for "{searchQuery}" didn't match any fuel stations
              </p>
              <button
                onClick={() => handleSearch("")}
                className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </div>
          ) : // <div className="mt-10 flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
          //   <Ban className="h-16 w-16 text-gray-400 mb-4" />
          //   <h3 className="text-xl font-medium text-gray-900 mb-2">No stations available</h3>
          //   <p className="text-gray-500">
          //     There are currently no fuel stations in the database
          //   </p>
          // </div>

          user ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 flex items-center justify-center">
                <SearchX className="h-16 w-16 text-gray-400 mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No stations found
              </h3>
              <p className="text-gray-500 mb-6">
                There are currently no fuel stations in our database.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Add Your First Station
              </button>
            </div>
          ) : (
            <div className="mt-10 flex flex-col items-center justify-center py-12">
              <Ban className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No stations available
              </h3>
              <p className="text-gray-500">
                There are currently no fuel stations in the database
              </p>
            </div>
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
                  isAdmin={user}
                  userEmail={user?.email}
                />
              </div>
            </div>
          )}
          <div className={`${!filteredPetrol.length && "hidden"}`}>
            <h1 className="text-3xl text-center mr-20 text-md -mt-1 font-bold text-[#616161]">
              Petrol
            </h1>
            <PetrolTable data={filteredPetrol.slice(0, 5)} loading={loading} fullData={filteredPetrol}/>
          </div>
          <div className={`${!filteredDiesel.length && "hidden"}`}>
            <h1 className="text-3xl text-center mr-20 text-md -mt-1 font-bold text-[#616161]">
              Diesel
            </h1>
            <DieselTable data={filteredDiesel.slice(0, 5)} loading={loading} fullData={filteredDiesel}/>
          </div>
          <div className={`${!filteredKerosene.length && "hidden"}`}>
            <h1 className="text-3xl text-center mr-20 text-md -mt-1 font-bold text-[#616161]">
              Kerosene
            </h1>
            <KeroseneTable
              data={filteredKerosene.slice(0, 5)}
              loading={loading}
              fullData={filteredKerosene}
            />
          </div>
        </div>
      </main>
      <div
        className={`${
          mergedData.length ? "mt-20 bg-zinc-200 w-full h-[2px]" : "hidden"
        }`}
      />

      <div className="mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredMergedData.map((item, index) => (
          <Link to={`/stations/${slugify(item.station_location)}`} key={index}>
            <div className="cursor-pointer h-[100%] max-h-[400px] flex flex-col justify-between bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {item?.station_location}
                  </h2>
                  <p className="text-zinc-500">
                    {item.stationCount}{" "}
                    {item.stationCount === 1 ? "station" : "stations"}
                  </p>
                </div>
                <Fuel className="h-6 w-6 text-blue-500" />
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                  <span className="text-gray-600 font-medium">Petrol</span>
                  <span className="text-lg font-bold text-green-600">
                    {item?.petrolPrice ? `₦${item.petrolPrice}/L` : "NA"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                  <span className="text-gray-600 font-medium">Diesel</span>
                  <span className="text-lg font-bold text-green-600">
                    {item.dieselPrice ? `₦${item.dieselPrice}/L` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                  <span className="text-gray-600 font-medium">Kerosene</span>
                  <span className="text-lg font-bold text-green-600">
                    {item.kerosenePrice ? `₦${item.kerosenePrice}/L` : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
