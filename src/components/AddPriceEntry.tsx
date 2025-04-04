import React, { useState } from 'react';
import { Plus, X, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

// Validation Schema
const priceEntrySchema = z.union([
  z.object({
    stationName: z.string().min(1, "Station name is required"),
    location: z.string().min(1, "Location is required"),
    fuelType: z.literal("Petrol"),
    petrolPrice: z.number().positive("Petrol price must be positive"),
    effectiveDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  }),
  z.object({
    stationName: z.string().min(1, "Station name is required"),
    location: z.string().min(1, "Location is required"),
    fuelType: z.literal("Diesel"),
    dieselPrice: z.number().positive("Diesel price must be positive"),
    effectiveDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  }),
  z.object({
    stationName: z.string().min(1, "Station name is required"),
    location: z.string().min(1, "Location is required"),
    fuelType: z.literal("Kerosene"),
    kerosenePrice: z.number().positive("Kerosene price must be positive"),
    effectiveDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: "Invalid date format",
    }),
  }),
]);




type PriceEntry = z.infer<typeof priceEntrySchema>;

const initialFormState: PriceEntry = {
  stationName: '',
  location: '',
  petrolPrice: 0,
  dieselPrice: 0,
  kerosenePrice: 0,
  effectiveDate: new Date().toISOString().split('T')[0],
  fuelType: "Petrol", // Default value
};

interface AddPriceEntryProps {
  closeModal: () => void;
  onSuccess: (newEntry: any) => void;
}

export function AddPriceEntry({ closeModal, onSuccess }: AddPriceEntryProps) {
  const [formData, setFormData] = useState<PriceEntry>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Price") ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
  
      const validationResult = priceEntrySchema.safeParse(formData);
      if (!validationResult.success) {
        console.log("Validation errors:", validationResult.error.errors); // Debug
        const newErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please fix the form errors");
        setLoading(false);
        return;
      }
  
      setErrors({});
      let tableName = "";
      let price = 0;
  
      if (formData.fuelType === "Petrol") {
        tableName = "petrol_prices";
        price = formData.petrolPrice;
      } else if (formData.fuelType === "Diesel") {
        tableName = "diesel_prices";
        price = formData.dieselPrice;
      } else if (formData.fuelType === "Kerosene") {
        tableName = "kerosene_prices";
        price = formData.kerosenePrice;
      }
  
      if (!tableName || price <= 0) {
        console.log("Invalid price or fuel type:", { tableName, price });
        toast.error("Invalid price or fuel type selected!");
        return;
      }
  
      const { data, error } = await supabase
        .from(tableName)
        .insert([
          {
            station_name: formData.stationName,
            station_location: formData.location,
            price: price,
            tags: [],
            last_updated: new Date().toISOString(),
            effective_date: formData.effectiveDate,
          },
        ])
        .select()
        .single();
  
      if (error) {
        toast.error(`Failed to add price entry: ${error.message}`);
        setLoading(false);
        return;
      }
  
      toast.success("Price entry added successfully!");
      onSuccess(data);
      setFormData(initialFormState);
      setShowPreview(false);
      closeModal();
      setLoading(false);
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("Something went wrong, please try again.");
      setLoading(false);
    }
  };
  
  
  

  return (
    <div className="max-w-2xl mx-auto p-3 bg-white rounded-2xl">
      <Toaster position="top-right" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Fuel Type
          </label>
          <select
            name="fuelType"
            value={formData.fuelType}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
          >
            <option value="Petrol">Petrol</option>
            <option value="Diesel">Diesel</option>
            <option value="Kerosene">Kerosene</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Station Name
          </label>
          <input
            type="text"
            name="stationName"
            value={formData.stationName}
            onChange={handleInputChange}
            placeholder="Enter fuel station name"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="Enter station location"
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
          />
        </div>

        {/* <div className="grid grid-cols-2 gap-6"> */}
        {formData?.fuelType === 'Petrol' ? (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
      Petrol Price (₦/L)
    </label>
    <input
      type="number"
      name="petrolPrice"
      value={formData.petrolPrice}
      onChange={handleInputChange}
      placeholder="Enter petrol price"
      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
    />
    </div>
) : formData?.fuelType === "Diesel" ? (
  <>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      Diesel Price (₦/L)
    </label>
    <input
      type="number"
      name="dieselPrice"
      value={formData.dieselPrice}
      onChange={handleInputChange}
      min="0"
      step="0.01"
      placeholder="Enter diesel price"
      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
    />
  </>
) : (
  <>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      Kerosene Price (₦/L)
    </label>
    <input
      type="number"
      name="kerosenePrice"
      value={formData.kerosenePrice || 0}
      onChange={handleInputChange}
      min="0"
      step="0.01"
      placeholder="Enter kerosene price"
      className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
    />
  </>
)}

          <div>
            
          </div>
        {/* </div> */}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Effective Date
          </label>
          <input
            type="date"
            name="effectiveDate"
            value={formData.effectiveDate}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center items-center gap-2 px-6 py-3 text-white text-lg font-medium rounded-lg 
                bg-green-600 hover:bg-green-700 transition duration-300 shadow-lg"
          disabled={loading}
        >
          {loading ? (
            <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
          </div>
          ) : (
            "Add Price Entry"
          )}
        </button>
      </form>
    </div>
  );
}
