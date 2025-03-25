import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AddEntry() {
  const navigate = useNavigate();
  const [stationName, setStationName] = useState("");
  const [location, setLocation] = useState("");
  const [petrolPrice, setPetrolPrice] = useState("");
  const [dieselPrice, setDieselPrice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Backend API call to save data
    const newEntry = {
      name: stationName,
      location,
      petrol_price: petrolPrice,
      diesel_price: dieselPrice,
      last_updated: new Date().toISOString(),
    };

    console.log("Saving entry:", newEntry);

    // After saving, redirect to home
    navigate("/");
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Fuel Station</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">Station Name:</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md"
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Location:</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-md"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Petrol Price (₦/L):</label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded-md"
            value={petrolPrice}
            onChange={(e) => setPetrolPrice(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Diesel Price (₦/L):</label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded-md"
            value={dieselPrice}
            onChange={(e) => setDieselPrice(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
          Save Entry
        </button>
      </form>

      <button onClick={() => navigate("/")} className="mt-4 text-blue-500 hover:underline">
        Back to Home
      </button>
    </div>
  );
}
