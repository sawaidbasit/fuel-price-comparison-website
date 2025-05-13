import { useEffect, useRef, useState } from "react";
import { Ban, Clock, Fuel, Presentation as GasStation, X } from "lucide-react";
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
  const [data, setData] = useState([]);
  const hasFetched = useRef(false);

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
    const fetchPromises = tables.map(table => 
      supabase.from(table).select().then(response => ({ table, data: response.data, error: response.error }))
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
    fetchData()
};

const visibleTablesCount = [
  filteredPetrol.length,
  filteredDiesel.length,
  filteredKerosene.length,
].filter(Boolean).length;

const mergedData = petrolData
  .reduce((acc, petrolItem) => {
    const existingLocation = acc.find(item => 
      item.station_location === petrolItem.station_location
    );

    if (existingLocation) {
      // Update petrol price if newer
      if (new Date(petrolItem.last_updated) > new Date(existingLocation.last_updated)) {
        existingLocation.petrolPrice = petrolItem.price;
      }
      return acc;
    }

    // Find all stations at this location (for counting)
    const allStationsAtLocation = [
      ...petrolData.filter(p => p.station_location === petrolItem.station_location),
      ...dieselData.filter(d => d.station_location === petrolItem.station_location),
      ...keroseneData.filter(k => k.station_location === petrolItem.station_location)
    ];
    
    // Get unique station names
    const uniqueStations = [...new Set(allStationsAtLocation.map(s => s.station_name))];
    
    // Find matching diesel and kerosene prices (same as your original logic)
    const dieselItem = dieselData.find(d => 
      d.station_name === petrolItem.station_name && 
      d.station_location === petrolItem.station_location
    );
    
    const keroseneItem = keroseneData.find(k => 
      k.station_name === petrolItem.station_name && 
      k.station_location === petrolItem.station_location
    );

    acc.push({
      ...petrolItem,
      petrolPrice: petrolItem.price,
      dieselPrice: dieselItem?.price ?? null,
      kerosenePrice: keroseneItem?.price ?? null,
      stationCount: uniqueStations.length
    });

    return acc;
  }, [] as any[]);

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g
      , '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

useEffect(() => {
  const fetchAndStoreData = async () => {
    try {
      // Skip if already fetched
      if (hasFetched.current) return;
      hasFetched.current = true;

      // 1. Get the most recent submission timestamp from your database
      const { data: latestSubmission } = await supabase
        .from('pending_submissions')
        .select('submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single();

      console.log("Latest submission from DB:", latestSubmission?.submitted_at);

      // 2. Fetch from Google Sheets
      const sheetId = '1irB6iVfprUHA200qAYSE3saKDf6j_P3xCnB_o5GXkVk';
      const sheetName = 'Form Responses 1';
      const response = await fetch(`https://opensheet.elk.sh/${sheetId}/${sheetName}`);
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const formData = await response.json();
      console.log("Raw form data:", formData);

      // 3. Proper date parsing function for DD/MM/YYYY format
      const parseCustomDate = (dateString: string) => {
        const [day, month, year] = dateString.split(' ')[0].split('/');
        return new Date(`${year}-${month}-${day}T${dateString.split(' ')[1]}`);
      };

      // 4. Filter and transform submissions
      const newSubmissions = formData
        .filter(item => {
          if (!item.Timestamp) return false;
          
          const submissionTime = parseCustomDate(item.Timestamp);
          const lastDbTime = latestSubmission?.submitted_at ? new Date(latestSubmission.submitted_at) : null;
          
          console.log(`Comparing: ${submissionTime} > ${lastDbTime}`);
          return !lastDbTime || submissionTime > lastDbTime;
        })
        .map(item => ({
          station_name: item['Station Name']?.trim() || '',
          station_location: item['Location']?.trim() || '',
          petrol_price: parseFloat(item['Petrol Price']) || 0,
          diesel_price: parseFloat(item['Diesel Price']) || 0,
          kerosene_price: parseFloat(item['Kerosene Price']) || 0,
          submitted_by: item['Email']?.trim() || 'anonymous',
          status: 'pending',
          submitted_at: item.Timestamp ? parseCustomDate(item.Timestamp).toISOString() : new Date().toISOString()
        }));

      console.log("New submissions to insert:", newSubmissions);

      // 5. Insert into Supabase if there are new submissions
      if (newSubmissions.length > 0) {
        const { data, error } = await supabase
          .from('pending_submissions')
          .insert(newSubmissions)
          .select(); // Return inserted records

        if (error) throw error;
        
        console.log("Inserted data:", data);
        setData(prev => [...(prev || []), ...data]);
      }
      
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchAndStoreData();
}, []); 

// useEffect(() => {
//   const fetchAndStoreData = async () => {
//     try {
//       if (hasFetched.current) return;
//       hasFetched.current = true;

//       // Call the Edge Function
//       const { data, error } = await supabase.functions.invoke('sync-google-forms', {
//         body: {}
//       });

//       if (error) throw error;
      
//       // Get updated data from database
//       const { data: submissions, error: dbError } = await supabase
//         .from('pending_submissions')
//         .select('*')
//         .order('submitted_at', { ascending: false });

//       if (dbError) throw dbError;
      
//       setData(submissions || []);
      
//     } catch (err) {
//       console.error("Error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchAndStoreData();
// }, []);
// useEffect(() => {
//   // Initial data fetch
//   const fetchInitialData = async () => {
//     const { data, error } = await supabase
//       .from('pending_submissions')
//       .select('*')
//       .order('submitted_at', { ascending: false });
    
//     if (!error) setData(data || []);
//   };
//   fetchInitialData();

//   // Realtime subscription
//   const channel = supabase
//     .channel('pending_submissions_changes')
//     .on(
//       'postgres_changes',
//       {
//         event: '*',
//         schema: 'public',
//         table: 'pending_submissions',
//       },
//       (payload) => {
//         console.log('Realtime payload:', payload); // Debug log
//         const { eventType, new: newRecord, old } = payload;
        
//         setData(prev => {
//           switch (eventType) {
//             case 'INSERT':
//               return [newRecord, ...prev];
//             case 'UPDATE':
//               return prev.map(item => 
//                 item.id === newRecord.id ? newRecord : item
//               );
//             case 'DELETE':
//               return prev.filter(item => item.id !== old.id);
//             default:
//               return prev;
//           }
//         });
//       }
//     )
//     .subscribe();

//   return () => {
//     supabase.removeChannel(channel);
//   };
// }, []);
  // console.log(user, "<=== user")
console.log(data, "<=== data")
  // console.log(user, "<=== user")
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

        {user ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add New Entry
            </button>
          </div>
        ) : (
          <a 
            href={"https://docs.google.com/forms/d/1OjkTzr02Zf41669SYs0VSuxoY75yYX-Tp8Z0I6SoRGg/preview"} 
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Submit Fuel Prices
          </a>
        )}
        </div>
        <div
          className={`
            mt-10 gap-y-44 md:gap-y-32 justify-center grid gap-4
            ${visibleTablesCount === 1 ? 'grid-cols-1 ' : ''}
            ${visibleTablesCount === 2 ? 'grid-cols-2 max-md:grid-cols-1' : ''}
            ${visibleTablesCount >= 3 ? 'lg:grid-cols-3 md:grid-cols-2 max-md:grid-cols-1' : ''}
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
          <div className={`${!filteredPetrol.length && 'hidden'}`}>
          <PetrolTable data={filteredPetrol.slice(0,5)} loading={loading}/>
          </div>
          <div className={`${!filteredDiesel.length && 'hidden'}`}>
          <DieselTable data={filteredDiesel.slice(0,5)} loading={loading}/>
          </div>
          <div className={`${!filteredKerosene.length && 'hidden'}`}>
          <KeroseneTable data={filteredKerosene.slice(0,5)} loading={loading}/>
          </div>
        </div>
      </main>
    <div className="mt-20 bg-zinc-200 w-full h-[2px]"/>

    <div className="mt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {mergedData.map((item, index) => (
        <Link to={`/stations/${slugify(item.station_location)}`} key={index}>
          <div className="cursor-pointer h-[100%] max-h-[400px] flex flex-col justify-between bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {item?.station_location}
                </h2>
                <p className="text-zinc-500">
                  {item.stationCount} {item.stationCount === 1 ? 'station' : 'stations'}
                </p>
              </div>
              <Fuel className="h-6 w-6 text-blue-500" />
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                <span className="text-gray-600 font-medium">Petrol</span>
                <span className="text-lg font-bold text-green-600">
                  {item?.petrolPrice ? `₦${item.petrolPrice}/L` : 'NA'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                <span className="text-gray-600 font-medium">Diesel</span>
                <span className="text-lg font-bold text-green-600">
                  {item.dieselPrice ? `₦${item.dieselPrice}/L` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2">
                <span className="text-gray-600 font-medium">Kerosene</span>
                <span className="text-lg font-bold text-green-600">
                  {item.kerosenePrice ? `₦${item.kerosenePrice}/L` : 'N/A'}
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
