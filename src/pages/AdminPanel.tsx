import { Clock, Search, SearchX } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import toast, { Toaster } from 'react-hot-toast';

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

export function LoadingSpinner() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center py-12">
    <Clock className="h-12 w-12 text-gray-400 mb-4 animate-spin" />
    <h3 className="text-lg font-medium text-gray-700">Loading stations...</h3>
  </div>
  );
}

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

    fetchData();

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
    const editToast = toast.loading('Updating station...');

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
      toast.success('Station updated successfully!', {
        id: editToast,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Update failed";
      setError(errorMessage);
      toast.error(`Update failed: ${errorMessage}`, {
        id: editToast,
      });
  
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stationName: string) => {
    const deleteToast = toast.loading('Deleting station...');
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


      // 3. Verify deletions occurred
      const errors = deleteResults.map((r) => r.error).filter(Boolean);
      if (errors.length > 0) {
        throw new Error(
          `Deletion errors: ${errors.map((e: any) => e.message).join(", ")}`
        );
      }
      await fetchData();
      toast.success('Station deleted successfully!', {
        id: deleteToast,
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Deletion failed";
      setError(errorMessage);
      console.error("Delete error:", err);
      toast.error(`Deletion failed: ${errorMessage}`, {
        id: deleteToast,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  
    if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="text-red-500 text-2xl mb-4">⚠️ Error</div>
        <div className="text-gray-700 mb-6">{error}</div>
        <button
          onClick={() => {
            setError(null);
            fetchData();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster 
      position="top-right"
      toastOptions={{
        duration: 5000,
        style: {
          padding: '16px',
          color:"white",
        },
        success: {
          style: {
            background: '#10B981', 
          },
        },
        error: {
          style: {
            background: '#EF4444'
          },
        },
      }}
    />

      <main className="p-6 max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Fuel Price Management
        </h2>

        <div className="mb-4 relative">
          <input
            type="text"
            placeholder="Search by station name or location..."
            className="p-2 pl-10 border rounded w-full max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        <div className="overflow-x-auto bg-white rounded shadow ">
          <table className="min-w-full">
            <thead >
              <tr className="bg-gray-200 text-gray-700 items-start text-left text-sm uppercase">
                <th className="p-4">#</th>
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
              {paginatedStations.map((station, index) => {
                const serialNumber = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                return(
                <tr
                  key={`${station.id}-${station.station_name}`}
                  className="border-t hover:bg-gray-50 text-sm"
                >
                  <td className="p-4 text-gray-500">{serialNumber}</td>
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
                )
              }
              )}
            </tbody>
          </table>
          <div className="overflow-x-auto bg-white rounded shadow">
  
            {paginatedStations.length === 0 && (
              <div className="p-12 text-center">
              <div className="flex items-center justify-center rounded-full mb-4">
                <SearchX className="h-16 w-16 text-zinc-600" />
              </div>
              <h3 className="text-lg font-medium text-zinc-600 mb-1">No stations found</h3>
              
            </div>

            )}
        </div>
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
                  className="px-6 py-3 text-white text-lg font-medium rounded-lg 
                bg-green-600 hover:bg-green-700 transition duration-300 shadow-lg"
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
