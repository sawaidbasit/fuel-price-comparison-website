import { Fuel } from 'lucide-react';
import React, { useState } from 'react';

const dummyData = [
  {
    id: 1,
    email: 'user1@example.com',
    station: 'Lagos',
    petrol: 630,
    diesel: 710,
    kerosene: null,
    status: 'pending',
  },
  {
    id: 2,
    email: 'user2@example.com',
    station: 'Abuja',
    petrol: 645,
    diesel: null,
    kerosene: 800,
    status: 'approved',
  },
  {
    id: 3,
    email: 'user3@example.com',
    station: 'Kano',
    petrol: null,
    diesel: 700,
    kerosene: 750,
    status: 'pending',
  },
  {
    id: 1,
    email: 'user1@example.com',
    station: 'Lagos',
    petrol: 630,
    diesel: 710,
    kerosene: null,
    status: 'rejected',
  },
  {
    id: 2,
    email: 'user2@example.com',
    station: 'Abuja',
    petrol: 645,
    diesel: null,
    kerosene: 800,
    status: 'approved',
  },
  {
    id: 3,
    email: 'user3@example.com',
    station: 'Kano',
    petrol: null,
    diesel: 700,
    kerosene: 750,
    status: 'pending',
  },
  
];

export default function AdminPanel() {
  const [submissions, setSubmissions] = useState(dummyData);

  const updateStatus = (id:any, status: any) => {
    setSubmissions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, status } : sub))
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      {/* <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {
              submissions.filter(sub => sub.status === 'pending').length
            }{' '}
            New
          </span>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            Logout
          </button>
        </div>
      </header> */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Fuel className="h-10 w-10 text-green-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">
                Lagos Fuel Price Tracker
              </h1>
            </div>
            {/* {
              user && ( */}
                <button
                  // onClick={handleLogout}
                  className="bg-red-500 cursor-pointer text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              {/* )
            
            } */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto mt-5">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Fuel Price Submissions
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow">
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left text-sm uppercase">
                <th className="p-4">User Email</th>
                <th className="p-4">Station</th>
                <th className="p-4">Petrol</th>
                <th className="p-4">Diesel</th>
                <th className="p-4">Kerosene</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(sub => (
                <tr
                  key={sub.id}
                  className="border-t hover:bg-gray-50 text-sm"
                >
                  <td className="p-4">{sub.email}</td>
                  <td className="p-4">{sub.station}</td>
                  <td className="p-4">
                    {sub.petrol ? `₦${sub.petrol}` : '–'}
                  </td>
                  <td className="p-4">
                    {sub.diesel ? `₦${sub.diesel}` : '–'}
                  </td>
                  <td className="p-4">
                    {sub.kerosene ? `₦${sub.kerosene}` : '–'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`font-semibold ${
                        sub.status === 'approved'
                          ? 'text-green-600'
                          : sub.status === 'rejected'
                          ? 'text-red-600'
                          : 'text-yellow-500'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {sub.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(sub.id, 'approved')}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(sub.id, 'rejected')}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {sub.status !== 'pending' && (
                      <span className="text-gray-400 italic">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
