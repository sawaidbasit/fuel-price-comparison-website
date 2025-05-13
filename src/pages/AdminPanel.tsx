import { Fuel } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";

// Types
interface FuelPrice {
  id: number;
  station_name: string;
  station_location: string;
  price: number;
  tags: string[];
  last_updated: string;
  effective_date: string;
  status?: string;
}

interface MergedStation extends Omit<FuelPrice, "price"> {
  petrolPrice: number | null;
  dieselPrice: number | null;
  kerosenePrice: number | null;
}

const ITEMS_PER_PAGE = 10;

export default function AdminPanel() {
  const [mergedStations, setMergedStations] = useState<MergedStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<MergedStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStation, setEditingStation] = useState<MergedStation | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [petrolRes, dieselRes, keroseneRes] = await Promise.all([
        supabase.from("petrol_prices").select("*"),
        supabase.from("diesel_prices").select("*"),
        supabase.from("kerosene_prices").select("*"),
      ]);

      if (petrolRes.error || dieselRes.error || keroseneRes.error) {
        throw new Error("Failed to fetch some tables");
      }

      // const errors = [petrolRes.error, dieselRes.error, keroseneRes.error].filter(Boolean);
      // if (errors.length > 0) throw new Error(errors.map(e => e?.message).join(', '));

      const stationMap = new Map<string, MergedStation>();

      // Process petrol prices
      petrolRes.data?.forEach((station) => {
        stationMap.set(station.station_name, {
          ...station,
          petrolPrice: station.price,
          dieselPrice: null,
          kerosenePrice: null,
        });
      });

      // Process diesel prices
      dieselRes.data?.forEach((station) => {
        const existing = stationMap.get(station.station_name);
        if (existing) {
          existing.dieselPrice = station.price;
        } else {
          stationMap.set(station.station_name, {
            ...station,
            petrolPrice: null,
            dieselPrice: station.price,
            kerosenePrice: null,
          });
        }
      });

      keroseneRes.data?.forEach((station) => {
        const existing = stationMap.get(station.station_name);
        if (existing) {
          existing.kerosenePrice = station.price;
        } else {
          stationMap.set(station.station_name, {
            ...station,
            petrolPrice: null,
            dieselPrice: null,
            kerosenePrice: station.price,
          });
        }
      });

      const mergedData = Array.from(stationMap.values());
      setMergedStations(mergedData);
      setFilteredStations(mergedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

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

    fetchData(); // Fetch data after auth check

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchData]);

  useEffect(() => {
    const filtered = mergedStations.filter(
      (station) =>
        station.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.station_location
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredStations(filtered);
    setCurrentPage(1);
  }, [searchTerm, mergedStations]);

  const totalPages = Math.ceil(filteredStations.length / ITEMS_PER_PAGE);
  const paginatedStations = filteredStations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEdit = async (updatedData: MergedStation) => {
    try {
      setLoading(true);
      setError(null);

      const updates = [
        { table: "petrol_prices", price: updatedData.petrolPrice },
        { table: "diesel_prices", price: updatedData.dieselPrice },
        { table: "kerosene_prices", price: updatedData.kerosenePrice },
      ].filter(({ price }) => price !== null);

      const updateResults = await Promise.all(
        updates.map(({ table, price }) =>
          supabase
            .from(table)
            .update({
              price,
              last_updated: new Date().toISOString(),
            })
            .eq("station_name", updatedData.station_name)
            .select()
        )
      );

      console.log(updateResults, "<=== updateResult");
      const errors = updateResults.map((res) => res.error).filter(Boolean);
      if (errors.length > 0) {
        throw new Error(
          `Failed to update some tables: ${errors
            .map((e) => e?.message)
            .join(", ")}`
        );
      }

      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");

      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stationName: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. First verify the exact station name exists
      const { data: verifiedStation } = await supabase
        .from("petrol_prices")
        
        .select("station_name")
        .ilike("station_name", `%${stationName}%`)
        .limit(1)
        .single()
        .throwOnError();

      if (!verifiedStation) {
        throw new Error(`Station "${stationName}" not found in database`);
      }

      const exactStationName = verifiedStation.station_name;

      console.log("Deleting station:", exactStationName);
      // 2. Execute deletions with exact name matching
      const deleteResults = await Promise.all([
        supabase
          .from("petrol_prices")
          .delete()
          .ilike("station_name", exactStationName)
          .throwOnError(),
        supabase
          .from("diesel_prices")
          .delete()
          .ilike("station_name", exactStationName)
          .throwOnError(),
        supabase
          .from("kerosene_prices")
          .delete()
          .ilike("station_name", exactStationName)
          .throwOnError(),
      ]);

      console.log("Delete results:", deleteResults);

      // 3. Verify deletions occurred
      const errors = deleteResults.map((r) => r.error).filter(Boolean);
      if (errors.length > 0) {
        throw new Error(
          `Deletion errors: ${errors.map((e) => e.message).join(", ")}`
        );
      }

      // 4. Confirm records were actually deleted
      const { count: remainingCount } = await supabase
        .from("petrol_prices")
        .select("*", { count: "exact" })
        .eq("station_name", exactStationName);

      await fetchData(); // Refresh UI
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed");
      console.error("Delete error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
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
              <button
                onClick={handleLogout}
                className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto mt-5">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Fuel Price Management
        </h2>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by station name or location..."
            className="p-2 border rounded w-full max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto bg-white rounded shadow ">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left text-sm uppercase">
                <th className="p-4">Station Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Petrol (₦)</th>
                <th className="p-4">Diesel (₦)</th>
                <th className="p-4">Kerosene (₦)</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStations.map((station) => (
                <tr
                  key={`${station.id}-${station.station_name}`}
                  className="border-t hover:bg-gray-50 text-sm"
                >
                  <td className="p-4">{station.station_name}</td>
                  <td className="p-4">{station.station_location}</td>
                  <td className="p-4">
                    {station.petrolPrice ? `₦${station.petrolPrice}/L` : "NA"}
                  </td>
                  <td className="p-4">
                    {station.dieselPrice ? `₦${station.dieselPrice}/L` : "NA"}
                  </td>
                  <td className="p-4">
                    {station.kerosenePrice
                      ? `₦${station.kerosenePrice}/L`
                      : "NA"}
                  </td>
                  <td className="p-4">
                    {new Date(station.last_updated).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      {station.status || "Active"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingStation(station);
                        setIsModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(station.station_name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {isModalOpen && editingStation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Edit Station</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Station Name
                  </label>
                  <input
                    type="text"
                    value={editingStation.station_name}
                    className="mt-1 p-2 border rounded w-full"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Petrol Price (₦)
                  </label>
                  <input
                    type="number"
                    value={editingStation.petrolPrice || ""}
                    onChange={(e) =>
                      setEditingStation({
                        ...editingStation,
                        petrolPrice: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="mt-1 p-2 border rounded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Diesel Price (₦)
                  </label>
                  <input
                    type="number"
                    value={editingStation.dieselPrice || ""}
                    onChange={(e) =>
                      setEditingStation({
                        ...editingStation,
                        dieselPrice: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="mt-1 p-2 border rounded w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Kerosene Price (₦)
                  </label>
                  <input
                    type="number"
                    value={editingStation.kerosenePrice || ""}
                    onChange={(e) =>
                      setEditingStation({
                        ...editingStation,
                        kerosenePrice: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    className="mt-1 p-2 border rounded w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEdit(editingStation)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
