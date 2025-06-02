import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Link } from "react-router-dom";
import { Ban, Clock, Fuel, SearchX } from "lucide-react";
import { User } from "@supabase/supabase-js";

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

export default function FillingStations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [petrolData, setPetrolPrices] = useState<FuelStation[]>([]);
  const [dieselData, setDieselPrices] = useState<FuelStation[]>([]);
  const [keroseneData, setKerosenePrices] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllPrices = async () => {
      setLoading(true);

      const [petrolRes, dieselRes, keroseneRes] = await Promise.all([
        supabase.from("petrol_prices").select("*"),
        supabase.from("diesel_prices").select("*"),
        supabase.from("kerosene_prices").select("*"),
      ]);

      if (petrolRes.error) console.error("Petrol Error:", petrolRes.error);
      else setPetrolPrices(petrolRes.data);

      if (dieselRes.error) console.error("Diesel Error:", dieselRes.error);
      else setDieselPrices(dieselRes.data);

      if (keroseneRes.error)
        console.error("Kerosene Error:", keroseneRes.error);
      else setKerosenePrices(keroseneRes.data);

      setLoading(false);
    };

    fetchAllPrices();
  }, []);

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

  const allStations = [
    ...petrolData.map((item) => ({ ...item, fuel_type: "petrol" })),
    ...dieselData.map((item) => ({ ...item, fuel_type: "diesel" })),
    ...keroseneData.map((item) => ({ ...item, fuel_type: "kerosene" })),
  ];

  const mergedData = Object.values(
    allStations.reduce((acc, item) => {
      const key = `${item.station_name}__${item.station_location}`;
      if (!acc[key]) {
        acc[key] = {
          station_name: item.station_name,
          station_location: item.station_location,
          petrolPrice: null,
          dieselPrice: null,
          kerosenePrice: null,
          last_updated: item.last_updated,
          stationCount: 1,
        };
      }

      acc[key].last_updated =
        new Date(item.last_updated) > new Date(acc[key].last_updated)
          ? item.last_updated
          : acc[key].last_updated;

      if (item.fuel_type === "petrol") {
        acc[key].petrolPrice = item.price;
      } else if (item.fuel_type === "diesel") {
        acc[key].dieselPrice = item.price;
      } else if (item.fuel_type === "kerosene") {
        acc[key].kerosenePrice = item.price;
      }

      return acc;
    }, {} as Record<string, any>)
  );

  const filteredMergedData = mergedData.filter(
    (item) =>
      item.station_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.station_location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    console.log(filteredPetrol, "<=== filteredPetrol");
    console.log(filteredDiesel, "<=== filteredDiesel");
    console.log(filteredKerosene, "<=== filteredKerosene");

    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const LoadingIndicator = () => (
    <div className="mt-10 flex flex-col items-center justify-center py-12">
      <Clock className="h-12 w-12 text-gray-400 mb-4 animate-spin" />
      <h3 className="text-lg font-medium text-gray-700">Loading stations...</h3>
    </div>
  );

  const NoResults = ({
    query,
    onClear,
  }: {
    query: string;
    onClear: () => void;
  }) => (
    <div className="mt-10 flex flex-col items-center justify-center py-12">
      <SearchX className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        No results found
      </h3>
      <p className="text-gray-500">
        Your search for "{query}" didn't match any fuel stations.
      </p>
      <button
        onClick={onClear}
        className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
      >
        Clear search
      </button>
    </div>
  );


  const NoData = () => (
    <div className="mt-10 flex flex-col items-center justify-center py-12">
      <Ban className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">
        No stations available
      </h3>
      <p className="text-gray-500">
        There are currently no fuel stations in the database.
      </p>
    </div>
  );

  return (
    <div>
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
        </div>

        {loading ? (
          <LoadingIndicator />
        ) : !filteredPetrol.length &&
          !filteredDiesel.length &&
          !filteredKerosene.length ? (
          searchQuery ? (
            <NoResults query={searchQuery} onClear={() => handleSearch("")} />
          ) : (
            <NoData />
          )
        ) : (
          <div className="mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4  py-8">
            {filteredMergedData.map((item, index) => (
              <Link
                to={`/stations/${slugify(item.station_location)}`}
                key={index}
              >
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
                        {item?.petrolPrice ? `₦${item.petrolPrice}/L` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                      <span className="text-gray-600 font-medium">Diesel</span>
                      <span className="text-lg font-bold text-green-600">
                        {item.dieselPrice ? `₦${item.dieselPrice}/L` : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                      <span className="text-gray-600 font-medium">
                        Kerosene
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {item.kerosenePrice
                          ? `₦${item.kerosenePrice}/L`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
