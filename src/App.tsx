import React, { useState } from 'react';
import { Fuel, Presentation as GasStation } from 'lucide-react';
import { AddPriceEntry } from './components/AddPriceEntry';
import { ProtectedRoute } from './components/ProtectedRoute';
import AuthForm from './components/AuthForm';
import AppRoutes from './routes';

interface FuelStation {
  id: number;
  name: string;
  location: string;
  petrol_price: number;
  diesel_price: number;
  last_updated: string;
}

// Mock data for fuel stations in Lagos
const mockStations: FuelStation[] = [
  {
    id: 1,
    name: "Total Filling Station",
    location: "Victoria Island, Lagos",
    petrol_price: 617,
    diesel_price: 625,
    last_updated: "2025-03-09T10:00:00Z"
  },
  {
    id: 2,
    name: "MRS Oil",
    location: "Lekki Phase 1, Lagos",
    petrol_price: 615,
    diesel_price: 630,
    last_updated: "2025-03-09T09:30:00Z"
  },
  {
    id: 3,
    name: "Mobil",
    location: "Ikeja, Lagos",
    petrol_price: 610,
    diesel_price: 620,
    last_updated: "2025-03-09T08:45:00Z"
  },
  {
    id: 4,
    name: "NNPC Retail",
    location: "Surulere, Lagos",
    petrol_price: 605,
    diesel_price: 618,
    last_updated: "2025-03-09T11:15:00Z"
  },
  {
    id: 5,
    name: "Conoil",
    location: "Ajah, Lagos",
    petrol_price: 619,
    diesel_price: 628,
    last_updated: "2025-03-09T10:30:00Z"
  },
  {
    id: 6,
    name: "Oando",
    location: "Maryland, Lagos",
    petrol_price: 612,
    diesel_price: 622,
    last_updated: "2025-03-09T09:15:00Z"
  }
];

// Mock authentication state - in a real app, this would come from your auth system
const mockAuthState = {
  isAuthenticated: true,
  isAdmin: true,
};

function App() {
  const [sortBy, setSortBy] = useState<'petrol' | 'diesel'>('petrol');
  const [stations, setStations] = useState<FuelStation[]>(() => {
    // Initial sort by petrol price
    return [...mockStations].sort((a, b) => a.petrol_price - b.petrol_price);
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSort = (type: 'petrol' | 'diesel') => {
    setSortBy(type);
    setStations([...mockStations].sort((a, b) => 
      type === 'petrol' 
        ? a.petrol_price - b.petrol_price 
        : a.diesel_price - b.diesel_price
    ));
  };

  return (
    // <div className="min-h-screen bg-gray-50">
    //   {/* Header */}
      // <header className="bg-white shadow-sm">
      //   <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
      //     <div className="flex items-center justify-between">
      //       <div className="flex items-center">
      //         <GasStation className="h-8 w-8 text-blue-600" />
      //         <h1 className="ml-2 text-2xl font-bold text-gray-900">Lagos Fuel Price Tracker</h1>
      //       </div>
      //         <div>
      //         <button
      //           onClick={() => handleSort('petrol')}
      //           className={`px-4 py-2 rounded-md ${
      //             sortBy === 'petrol'
      //               ? 'bg-blue-600 text-white'
      //               : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      //           }`}
      //         >
      //           Sort by Petrol
      //         </button>
      //         <button
      //           onClick={() => handleSort('diesel')}
      //           className={`px-4 py-2 rounded-md ${
      //             sortBy === 'diesel'
      //               ? 'bg-blue-600 text-white'
      //               : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      //           }`}
      //         >
      //           Sort by Diesel
      //         </button>
      //     {/* <AuthForm /> */}
          

      //         {mockAuthState.isAuthenticated && mockAuthState.isAdmin && (
      //           <button
      //             onClick={() => setShowAddForm(!showAddForm)}
      //             className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      //           >
      //             {showAddForm ? 'View Listings' : 'Add New Entry'}
      //           </button>
      //         )}
      //         </div>
      //         <div>
      //         <button  className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
      //   Login
      // </button>
      // <button className="bg-green-500 text-white px-4 py-2 rounded">
      //   Sign Up
      // </button>
      //         </div>
      //       </div>
      //   </div>
      // </header>

      // {/* Main Content */}
      // <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      //   {showAddForm ? (
      //     <ProtectedRoute
      //       isAuthenticated={mockAuthState.isAuthenticated}
      //       isAdmin={mockAuthState.isAdmin}
      //     >
      //       <AddPriceEntry />

      //     </ProtectedRoute>
        
      // ) : (
      //     <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

      //       {stations.map((station) => (
      //         <div
      //           key={station.id}
      //           className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
      //         >
      //           <div className="flex items-start justify-between">
      //             <div>
      //               <h2 className="text-xl font-semibold text-gray-900">{station.name}</h2>
      //               <p className="text-gray-600 mt-1">{station.location}</p>
      //             </div>
      //             <Fuel className="h-6 w-6 text-blue-600" />
      //           </div>
      //           <div className="mt-4 space-y-2">
      //             <div className="flex justify-between items-center">
      //               <span className="text-gray-600">Petrol</span>
      //               <span className="text-lg font-semibold">₦{station.petrol_price}/L</span>
      //             </div>
      //             <div className="flex justify-between items-center">
      //               <span className="text-gray-600">Diesel</span>
      //               <span className="text-lg font-semibold">₦{station.diesel_price}/L</span>
      //             </div>
      //           </div>
      //           <div className="mt-4 text-sm text-gray-500">
      //             Last updated: {new Date(station.last_updated).toLocaleDateString()}
      //           </div>
      //         </div>
      //       ))}
      //     </div>
      //   )}
      // </main>
    // </div>
    <AppRoutes />
  );
}

export default App;