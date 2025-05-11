import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true },
});

// (async () => {
//   const { data, error } = await supabase.from('fuel_stations').select('*');
//   if (error) {
//     console.error('Database connection failed:', error.message);
//   } else {
//     console.log('Database connected! Fuel Stations:', data);
//   }
// })();


// export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
