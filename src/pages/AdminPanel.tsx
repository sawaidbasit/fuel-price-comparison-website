import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Adjust import path
import type { User } from '@supabase/supabase-js';
import { Fuel } from 'lucide-react';

interface PendingSubmission {
  id: number;
  station_name: string;
  station_location: string;
  petrol_price: number;
  diesel_price: number;
  kerosene_price: number;
  submitted_by: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [pendingData, setPendingData] = useState<PendingSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial pending submissions
  // useEffect(() => {
  //   const fetchPendingSubmissions = async () => {
  //     try {
  //       setLoading(true);
  //       const { data, error } = await supabase
  //         .from('pending_submissions')
  //         .select('*')
  //         .order('submitted_at', { ascending: false });

  //       if (error) throw error;
  //       setPendingData(data as PendingSubmission[]);
  //     } catch (err) {
  //       setError(err instanceof Error ? err.message : 'Failed to fetch data');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchPendingSubmissions();
  // }, []);

  useEffect(() => {
    const fetchPendingSubmissions = async () => {
      try {
        setLoading(true);
        
        const { data: submissions, error } = await supabase
          .from('pending_submissions')
          .select('*')
          .order('submitted_at', { ascending: false });
  
        if (error) throw error;
        
        setPendingData(submissions || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingSubmissions();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('pending_submissions_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'pending_submissions' 
        },
        (payload) => {
          // Type-safe payload handling
          const newPayload = payload as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            new: PendingSubmission;
            old: { id: number };
          };

          setPendingData(prev => {
            // Handle each operation type safely
            switch (newPayload.eventType) {
              case 'INSERT':
                return [newPayload.new, ...prev];
              case 'UPDATE':
                return prev.map(item => 
                  item.id === newPayload.new.id ? newPayload.new : item
                );
              case 'DELETE':
                return prev.filter(item => item.id !== newPayload.old.id);
              default:
                return prev;
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleApproveSubmission = async (submission: PendingSubmission) => {
  try {
    setLoading(true);

    // 1. First insert into the respective price tables (using POST)
    const baseRecord = {
      station_name: submission.station_name,
      station_location: submission.station_location,
      last_updated: new Date().toISOString(),
      effective_date: submission.submitted_at || new Date().toISOString(),
      tags: [],
    };

    // Insert petrol price if exists
    if (submission.petrol_price !== null) {
      const { error: petrolError } = await supabase
        .from('petrol_prices')
        .insert({
          ...baseRecord,
          price: submission.petrol_price
        });

      if (petrolError) throw petrolError;
    }

    // Insert diesel price if exists
    if (submission.diesel_price !== null) {
      const { error: dieselError } = await supabase
        .from('diesel_prices')
        .insert({
          ...baseRecord,
          price: submission.diesel_price
        });

      if (dieselError) throw dieselError;
    }

    // Insert kerosene price if exists
    if (submission.kerosene_price !== null) {
      const { error: keroseneError } = await supabase
        .from('kerosene_prices')
        .insert({
          ...baseRecord,
          price: submission.kerosene_price
        });

      if (keroseneError) throw keroseneError;
    }

    // 2. Only after successful inserts, update submission status (using PATCH)
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ status: 'approved' })
      .eq('id', submission.id);

    if (updateError) throw updateError;

    // toast.success('Prices added to respective tables!');
    // refreshSubmissions(); // Refresh your data

  } catch (error) {
    console.error('Approval Error:', error);
    // toast.error('Failed to add prices: ' + error.message);
  } finally {
    setLoading(false);
  }
};
  const updateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      // Optimistic update
      setPendingData(prev =>
        prev.map(sub => 
          sub.id === id ? { ...sub, status } : sub
        )
      );

      // Database update
      const { error } = await supabase
        .from('pending_submissions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      setPendingData(prev =>
        prev.map(sub => 
          sub.id === id ? { ...sub, status: 'pending' } : sub
        )
      );
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
              {pendingData.map(sub => (
                <tr
                  key={sub.id}
                  className="border-t hover:bg-gray-50 text-sm"
                >
                  <td className="p-4">{sub.submitted_by}</td>
                  <td className="p-4">{sub.station_name}</td>
                  <td className="p-4">
                    {sub.petrol_price ? `₦${sub.petrol_price}` : '–'}
                  </td>
                  <td className="p-4">
                    {sub.diesel_price ? `₦${sub.diesel_price}` : '–'}
                  </td>
                  <td className="p-4">
                    {sub.kerosene_price ? `₦${sub.kerosene_price}` : '–'}
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
                        {/* <button
                          onClick={() => updateStatus(sub.id, 'approved')}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                        >
                          Approve
                        </button> */}
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          onClick={() => handleApproveSubmission(sub)}
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
