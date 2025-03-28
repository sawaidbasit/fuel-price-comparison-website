import { useEffect, useState } from "react";
import { Ban, Clock, Fuel, Presentation as GasStation, X } from "lucide-react";
import { AddPriceEntry } from "../components/AddPriceEntry";
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
  const [data, setData] = useState<FuelStation[]>([]);

  const [sortBy, setSortBy] = useState<"petrol" | "diesel">("petrol");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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
    setIsLoading(true);
    const { data } = await supabase.from("fuel_stations").select();
    if (data) {
      setData([...data].sort((a, b) => a.petrol_price - b.petrol_price));
      setIsLoading(false)
    }
  };

  const filteredData = data.filter(
    (station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    fetchData();
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
    setData((prevData) => [...prevData, newEntry]);
    setShowAddForm(false);
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
            {user && (
              <button
                onClick={handleLogout}
                className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded"
              >
                Logout
              </button>
            ) 
            // : (
            //   <button
            //     onClick={() => navigate("/login")}
            //     className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            //   >
            //     Login
            //   </button>
            // )
            }
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-5 justify-between">
          <div className="flex gap-4 w-full max-w-4xl max-sm:flex-col">

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
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Sort by Petrol
              </button>
              <button
                onClick={() => handleSort("diesel")}
                className={`px-4 py-2 rounded-md ${
                  sortBy === "diesel"
                    ? "bg-green-600 text-white"
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
        <div className="mt-10 gap-y-32 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
              // <div
              //   key={station.id}
              //   className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow border border-gray-200"
              // >
              //   <div className="flex items-center justify-between">
              //     <div>
              //       <h2 className="text-xl font-semibold text-gray-900">
              //         {station.name}
              //       </h2>
              //       <p className="text-gray-500 text-sm mt-1">
              //         {station.location}
              //       </p>
              //     </div>
              //     <Fuel className="h-6 w-6 text-green-600" />
              //   </div>

              //   <div className="mt-4 space-y-3">
              //     <div className="flex justify-between items-center bg-gray-100 rounded-lg px-4 py-2">
              //       <span className="text-gray-600 font-medium">Petrol</span>
              //       <span className="text-lg font-bold text-green-600">
              //         ₦{station.petrol_price}/L
              //       </span>
              //     </div>
              //     <div className="flex justify-between items-center bg-gray-100 rounded-lg px-4 py-2">
              //       <span className="text-gray-600 font-medium">Diesel</span>
              //       <span className="text-lg font-bold text-red-600">
              //         ₦{station.diesel_price}/L
              //       </span>
              //     </div>
              //   </div>

              //   <div className="mt-4 flex items-center text-sm text-gray-500">
              //     <Clock className="h-4 w-4 mr-1" />
              //     Last updated:{" "}
              //     {station.effective_date
              //       ? new Date(station.effective_date).toLocaleDateString()
              //       : "N/A"}
              //   </div>
              // </div>

              <div className="relative flex justify-center border-1">
  <div className="w-full flex justify-center relative z-10">
<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--noto" preserveAspectRatio="xMidYMid meet" fill="#383838" stroke="#383838"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M79.69 62.69c7.36 15.65 30.45 32.94 32.41 42.77c1.34 6.7-3.33 12.26-9.19 11.2c-6.6-1.19-6.91-10.69-4.31-17.99c6.54-18.38 8.79-28.99 6.53-38.95l-1.08-4.68" fill="none" stroke="#166534616161" stroke-width="6" stroke-miterlimit="10"> </path> <path d="M80.82 56.1c-1.87 0-1.14-1.61-1.14-3.6V25.92c0-1.99-.73-3.6 1.14-3.6s5.12 1.11 5.12 3.6V52.5c0 1.99-3.25 3.6-5.12 3.6z" fill="#16653482aec0"> </path> <path d="M82.1 113.93V27.96C82.1 14.73 71.37 4 58.14 4H34.96C21.72 4 11 14.73 11 27.96v85.97c-3.3.97-5.71 4.02-5.71 7.63v.3c0 1.18.96 2.14 2.14 2.14h78.24c1.18 0 2.14-.96 2.14-2.14v-.3a7.95 7.95 0 0 0-5.71-7.63z" fill="#166534"> </path> <path d="M65.68 56.57H26.93c-1.77 0-3.21-1.44-3.21-3.21V22.42c0-1.77 1.44-3.21 3.21-3.21h38.75c1.77 0 3.21 1.44 3.21 3.21v30.93a3.21 3.21 0 0 1-3.21 3.22z" fill="#166534fffff"> </path> <path fill="#1665349e9e9e" d="M32.22 29.6h29.31v7.64H32.22z"> </path> <path fill="#1665349e9e9e" d="M32.22 41.36h29.31V49H32.22z"> </path> <path d="M24.13 47c-.05.52-.81.52-.86.01c-.74-7.27-1.16-14.55-1.48-21.82c-.47-4.02 2.63-7.49 6.78-7.21c11.79-.35 23.64-.35 35.43-.01c4.14-.28 7.27 3.19 6.79 7.21c-.32 7.28-.75 14.57-1.49 21.85c-.05.52-.81.52-.86 0c-.77-7.53-1.19-15.07-1.53-22.59a2.11 2.11 0 0 0-.09-.45c-.25-.9-1.12-1.65-2.02-1.56c-.48.02-36.58.01-37.04-.01c-.9-.09-1.77.66-2.02 1.57c-.04.15-.07.3-.09.45c-.34 7.51-.75 15.04-1.52 22.56z" fill="#16653482aec0"> </path> <ellipse cx="46.31" cy="84.08" rx="16.79" ry="17.89" fill="#1665345f5f5"> </ellipse> <path d="M38.87 86.6c0-4.37 7.43-12.95 7.43-12.95s7.43 8.58 7.43 12.95s-3.33 7.92-7.43 7.92s-7.43-3.55-7.43-7.92z" fill="#166534212121"> </path> <path fill="#166534c62828" d="M11 110.03h71.1v3.89H11z"> </path> <path d="M17.45 22.04c.88-4.96 5.2-11.1 14.13-11.1" fill="none" stroke="#166534f7555" stroke-width="5" stroke-linecap="round" stroke-miterlimit="10"> </path> <g> <path fill="#1665349e9e9e" d="M108.059 58.98l-5.796 1.472l-.955-3.76l5.796-1.472z"> </path> <path d="M104.77 29.85l6.73-12.2c.5-.9 1.16-1.7 1.95-2.35c2.46-2.02 7.97-6.58 9.13-7.84c1.51-1.64-1.29-5.1-3.28-3.73c-1.56 1.08-7.3 6.12-9.69 8.23c-.7.61-1.28 1.34-1.73 2.16l-7.07 12.82l3.96 2.91z" fill="#1665349e9e9e"> </path> <path d="M100.66 37.73l9.42-1.95l3.32 11.82c.53 2.08-.43 2.68-2.27 3.15l-6.66 1.85m-5.22-15.27l8.05 18.35l7.62-2.13c3.19-.93 3.1-3.53 2.61-5.46l-3.93-14.4l-14.35 3.64z" fill="#166534757575"> </path> <path d="M103.82 21.12l4.87 2.74c.65.36.89 1.17.56 1.83l-.97 1.94l2.25 1.7a8.565 8.565 0 0 1 3.16 4.77l.27 1.05l-6.96 1.79a2.742 2.742 0 0 0-1.95 3.34l3.21 12.63c.32 1.36.4 2.48-.97 2.78l-5.55 1.38c-1.32.29-2.63-.52-2.96-1.83L94.9 39.95c-1.74-6.85.94-9.17 1.5-10.3s3.5-4.21 3.5-4.21l2.01-3.76c.37-.69 1.23-.94 1.91-.56z" fill="#166534"> </path> <path fill="none" stroke="#166534f7555" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M106.8 29.34l-4.83-2.42"> </path> </g> </g></svg>
  {/* <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--noto" preserveAspectRatio="xMidYMid meet" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M79.69 62.69c7.36 15.65 30.45 32.94 32.41 42.77c1.34 6.7-3.33 12.26-9.19 11.2c-6.6-1.19-6.91-10.69-4.31-17.99c6.54-18.38 8.79-28.99 6.53-38.95l-1.08-4.68" fill="none" stroke="#616161" stroke-width="6" stroke-miterlimit="10"> </path> <path d="M80.82 56.1c-1.87 0-1.14-1.61-1.14-3.6V25.92c0-1.99-.73-3.6 1.14-3.6s5.12 1.11 5.12 3.6V52.5c0 1.99-3.25 3.6-5.12 3.6z" fill="#82aec0"> </path> <path d="M82.1 113.93V27.96C82.1 14.73 71.37 4 58.14 4H34.96C21.72 4 11 14.73 11 27.96v85.97c-3.3.97-5.71 4.02-5.71 7.63v.3c0 1.18.96 2.14 2.14 2.14h78.24c1.18 0 2.14-.96 2.14-2.14v-.3a7.95 7.95 0 0 0-5.71-7.63z" fill="#f44336"> </path> <path d="M65.68 56.57H26.93c-1.77 0-3.21-1.44-3.21-3.21V22.42c0-1.77 1.44-3.21 3.21-3.21h38.75c1.77 0 3.21 1.44 3.21 3.21v30.93a3.21 3.21 0 0 1-3.21 3.22z" fill="#ffffff"> </path> <path fill="#9e9e9e" d="M32.22 29.6h29.31v7.64H32.22z"> </path> <path fill="#9e9e9e" d="M32.22 41.36h29.31V49H32.22z"> </path> <path d="M24.13 47c-.05.52-.81.52-.86.01c-.74-7.27-1.16-14.55-1.48-21.82c-.47-4.02 2.63-7.49 6.78-7.21c11.79-.35 23.64-.35 35.43-.01c4.14-.28 7.27 3.19 6.79 7.21c-.32 7.28-.75 14.57-1.49 21.85c-.05.52-.81.52-.86 0c-.77-7.53-1.19-15.07-1.53-22.59a2.11 2.11 0 0 0-.09-.45c-.25-.9-1.12-1.65-2.02-1.56c-.48.02-36.58.01-37.04-.01c-.9-.09-1.77.66-2.02 1.57c-.04.15-.07.3-.09.45c-.34 7.51-.75 15.04-1.52 22.56z" fill="#82aec0"> </path> <ellipse cx="46.31" cy="84.08" rx="16.79" ry="17.89" fill="#f5f5f5"> </ellipse> <path d="M38.87 86.6c0-4.37 7.43-12.95 7.43-12.95s7.43 8.58 7.43 12.95s-3.33 7.92-7.43 7.92s-7.43-3.55-7.43-7.92z" fill="#212121"> </path> <path fill="#c62828" d="M11 110.03h71.1v3.89H11z"> </path> <path d="M17.45 22.04c.88-4.96 5.2-11.1 14.13-11.1" fill="none" stroke="#ff7555" stroke-width="5" stroke-linecap="round" stroke-miterlimit="10"> </path> <g> <path fill="#9e9e9e" d="M108.059 58.98l-5.796 1.472l-.955-3.76l5.796-1.472z"> </path> <path d="M104.77 29.85l6.73-12.2c.5-.9 1.16-1.7 1.95-2.35c2.46-2.02 7.97-6.58 9.13-7.84c1.51-1.64-1.29-5.1-3.28-3.73c-1.56 1.08-7.3 6.12-9.69 8.23c-.7.61-1.28 1.34-1.73 2.16l-7.07 12.82l3.96 2.91z" fill="#9e9e9e"> </path> <path d="M100.66 37.73l9.42-1.95l3.32 11.82c.53 2.08-.43 2.68-2.27 3.15l-6.66 1.85m-5.22-15.27l8.05 18.35l7.62-2.13c3.19-.93 3.1-3.53 2.61-5.46l-3.93-14.4l-14.35 3.64z" fill="#757575"> </path> <path d="M103.82 21.12l4.87 2.74c.65.36.89 1.17.56 1.83l-.97 1.94l2.25 1.7a8.565 8.565 0 0 1 3.16 4.77l.27 1.05l-6.96 1.79a2.742 2.742 0 0 0-1.95 3.34l3.21 12.63c.32 1.36.4 2.48-.97 2.78l-5.55 1.38c-1.32.29-2.63-.52-2.96-1.83L94.9 39.95c-1.74-6.85.94-9.17 1.5-10.3s3.5-4.21 3.5-4.21l2.01-3.76c.37-.69 1.23-.94 1.91-.56z" fill="#f44336"> </path> <path fill="none" stroke="#ff7555" stroke-width="4" stroke-linecap="round" stroke-miterlimit="10" d="M106.8 29.34l-4.83-2.42"> </path> </g> </g></svg> */}
  </div>

  <div className="text-white absolute top-20 mr-24 max-w-[300px] px-4 z-20 text-center">
    <h3 className="text-xl font-semibold">Petrol Price</h3>
    <h1 className="text-xl -mt-1 font-bold">
      $59 <span className="text-md">/lo</span>
    </h1>
    <p className="text-md">PRICE PER LITER</p>
  </div>

  <div className="absolute bottom-0 top-48 mr-20 z-30 w-full max-w-[80%]">
  <table className="w-full border border-[#383838]">
  <thead>
    <tr className="bg-green-700 text-white">
      <th className="text-left px-4 py-2">STATION</th>
      <th className="text-center px-4 py-2">PRICE</th>
      <th className="text-center px-4 py-2">PRICE</th>
    </tr>
  </thead>
  <tbody>
    <tr className="bg-green-600 text-white border-b border-[#383838]">
      <td className="px-4 py-2">Diesslo</td>
      <td className="text-center px-4 py-2">$84.99</td>
      <td className="text-center px-4 py-2">657</td>
    </tr>
    <tr className="bg-green-500 text-white border-b border-[#383838]">
      <td className="px-4 py-2">Diessel</td>
      <td className="text-center px-4 py-2">$11.99</td>
      <td className="text-center px-4 py-2">617</td>
    </tr>
    <tr className="bg-green-600 text-white border-b border-[#383838]">
      <td className="px-4 py-2">Kiosne</td>
      <td className="text-center px-4 py-2">$12.99</td>
      <td className="text-center px-4 py-2">617</td>
    </tr>
    <tr className="bg-green-500 text-white border-b border-[#383838]">
      <td className="px-4 py-2">Fill Nigeria</td>
      <td className="text-center px-4 py-2">$19.99</td>
      <td className="text-center px-4 py-2">677</td>
    </tr>
    <tr className="bg-green-600 text-white">
      <td className="px-4 py-2">Filling Sttalis</td>
      <td className="text-center px-4 py-2">$17.99</td>
      <td className="text-center px-4 py-2">600</td>
    </tr>
  </tbody>
</table>

  </div>
</div>
            ))
          ) }
        </div>
        {isLoading && (
          <div className="flex justify-center items-center h-64 w-full">
          <span className="animate-spin border-8 border-blue-500 border-t-transparent rounded-full h-12 w-12"></span>
        </div>
        )}
        {!filteredData.length &&  !isLoading && (
            <div className="flex flex-col justify-center items-center h-screen w-full">
            <Ban className="text-gray-400 w-12 h-12 mb-2" />
            <p className="text-center text-gray-500 text-lg">No stations found.</p>
          </div>
          )}
      </main>
    </div>
  );
}
