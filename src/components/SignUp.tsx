import { supabase } from '../../lib/supabaseClient';

const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error('Sign-up failed:', error.message);
    return error.message;
  }

  console.log('User signed up:', data);
  return 'Sign-up successful! Please check your email for verification.';
};
