import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AuthForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Sign-up successful! Please check your email.');
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Login successful!');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Sign In / Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 border rounded mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full p-2 border rounded mb-4"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleSignIn} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
        Login
      </button>
      <button onClick={handleSignUp} className="bg-green-500 text-white px-4 py-2 rounded">
        Sign Up
      </button>

      {loading && <p>Loading...</p>}
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
}
