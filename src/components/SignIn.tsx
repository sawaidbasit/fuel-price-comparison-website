import { supabase } from '../../lib/supabaseClient';

const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login failed:', error.message);
    return error.message;
  }

  console.log('User signed in:', data);
  return 'Login successful!';
};
