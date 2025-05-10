import React, { useState } from "react";
import { Toaster, toast } from "react-hot-toast";

const dummyStations = [
  { id: 1, name: "Total - Ikoyi", location: "Ikoyi, Lagos" },
  { id: 2, name: "Mobil - Lekki Phase 1", location: "Lekki, Lagos" },
  { id: 3, name: "Oando - Gwarinpa", location: "Abuja" },
];

interface UserSubmission {
  stationId: number | null;
  petrolPrice?: number;
  dieselPrice?: number;
  kerosenePrice?: number;
}

export default function UserSubmissionForm() {
  const [formData, setFormData] = useState<UserSubmission>({
    stationId: null,
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("Price") && value !== ""
          ? parseFloat(value)
          : name === "stationId"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stationId) {
      toast.error("Please select a fuel station.");
      return;
    }

    if (
      !formData.petrolPrice &&
      !formData.dieselPrice &&
      !formData.kerosenePrice
    ) {
      toast.error("Please provide at least one fuel price.");
      return;
    }

    try {
      setLoading(true);
      // Simulate success
      setTimeout(() => {
        toast.success("Submitted successfully!");
        setFormData({ stationId: null });
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast.error("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-2xl shadow-md">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Submit Fuel Price</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Fuel Station
          </label>
          <select
            name="stationId"
            value={formData.stationId || ""}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
          >
            <option value="">-- Select Station --</option>
            {dummyStations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name} ({station.location})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Petrol Price (₦/L)
          </label>
          <input
            type="number"
            name="petrolPrice"
            onChange={handleInputChange}
            placeholder="e.g. 620"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diesel Price (₦/L)
          </label>
          <input
            type="number"
            name="dieselPrice"
            onChange={handleInputChange}
            placeholder="e.g. 650"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kerosene Price (₦/L)
          </label>
          <input
            type="number"
            name="kerosenePrice"
            onChange={handleInputChange}
            placeholder="e.g. 400"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-green-600 text-white font-medium text-lg hover:bg-green-700 transition"
        >
          {loading ? "Submitting..." : "Submit Price"}
        </button>
      </form>
    </div>
  );
}
