// import { useState, useEffect } from "react";
// import { supabase } from "../../lib/supabaseClient";
// import { useNavigate } from "react-router-dom";
// import { User } from "@supabase/supabase-js";

// export default function Authentication() {
  // const [user, setUser] = useState<User | null>(null);
  // const navigate = useNavigate();

  // useEffect(() => {
  //   // ✅ Check if the user is already logged in
  //   const checkAuth = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     setUser(user);
  //   };
  //   checkAuth();

  //   // ✅ Listen for changes in authentication state
  //   const { data: authListener } = supabase.auth.onAuthStateChange(
  //     (_, session) => {
  //       setUser(session?.user || null);
  //     }
  //   );

  //   return () => {
  //     authListener.subscription.unsubscribe();
  //   };
  // }, []);

  // const handleLogout = async () => {
  //   await supabase.auth.signOut();
  //   setUser(null);
  //   navigate("/login");
  // };

//   return (
//     <header className="bg-white shadow-sm p-4 flex justify-between">
//       <div>
//         {user ? (
//           <button
//             onClick={handleLogout}
//             className="bg-red-500 text-white px-4 py-2 rounded"
//           >
//             Logout
//           </button>
//         ) : (
//           <>
//             <button
//               onClick={() => navigate("/login")}
//               className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
//             >
//               Login
//             </button>
//             <button
//               onClick={() => navigate("/signup")}
//               className="bg-green-500 text-white px-4 py-2 rounded"
//             >
//               Sign Up
//             </button>
//           </>
//         )}
//       </div>
//     </header>
//   );
// }
