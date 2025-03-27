import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { any, z } from 'zod';
import { Plus, X, Eye } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import {supabase} from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
// Validation Schema
const priceEntrySchema = z.object({
  stationName: z.string().min(1, "Station name is required"),
  location: z.string().min(1, "Location is required"),
  petrolPrice: z.number().positive("Price must be positive"),
  dieselPrice: z.number().positive("Price must be positive"),
  effectiveDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

type PriceEntry = z.infer<typeof priceEntrySchema>;

const initialFormState: PriceEntry = {
  stationName: '',
  location: '',
  petrolPrice: 0,
  dieselPrice: 0,
  effectiveDate: new Date().toISOString().split('T')[0],
};


interface AddPriceEntryProps {
  closeModal: () => void;
  onSuccess: (newEntry: any) => void;
}

export function AddPriceEntry({ closeModal, onSuccess }: AddPriceEntryProps) {
  const [formData, setFormData] = useState<PriceEntry>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  const validateForm = () => {
    try {
      priceEntrySchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("fuel_stations")
        .insert([
          {
            name: formData.stationName,
            location: formData.location,
            petrol_price: formData.petrolPrice,
            diesel_price: formData.dieselPrice,
            last_updated: new Date().toISOString(),
            effective_date: formData.effectiveDate,
          },
        ])
        .select()
        .single();
    
      if (error) {
        console.error("Supabase Insert Error:", error.message);
        toast.error(`Failed to add price entry: ${error.message}`);
        return;
      }
    
      if (data) {
        toast.success("Price entry added successfully!");
        onSuccess(data); 
        setFormData(initialFormState);
        setShowPreview(false);
        closeModal();
      }
    } catch (error) {
      console.error("Error inserting data:", error);
      toast.error("Failed to add price entry");
    }    
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes("Price") ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-3 bg-white rounded-2xl">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6 max-sm:hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition duration-300 
                 text-blue-600 hover:bg-blue-50 hover:text-blue-800"
        >
          {showPreview ? (
            <>
              <X className="w-4 h-4" />
              Close Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Preview
            </>
          )}
        </button>
      </div>

      {showPreview && (
        <div className="mb-6 p-5 border border-gray-300 rounded-lg bg-gray-50 shadow-sm">
          <h3 className="font-semibold mb-3 text-gray-700">Preview</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-800">
            <p>
              <span className="font-medium">Station:</span>{" "}
              {formData.stationName}
            </p>
            <p>
              <span className="font-medium">Location:</span> {formData.location}
            </p>
            <p>
              <span className="font-medium">Petrol Price:</span> ₦
              {formData.petrolPrice}/L
            </p>
            <p>
              <span className="font-medium">Diesel Price:</span> ₦
              {formData.dieselPrice}/L
            </p>
            <p>
              <span className="font-medium">Effective Date:</span>{" "}
              {new Date(formData.effectiveDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Petrol Price (₦/L)
            </label>
            <input
              type="number"
              name="petrolPrice"
              value={formData.petrolPrice}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              placeholder="Enter petrol price"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            />
          </div>
          <div>
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
          </div>
        </div>

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
                 bg-blue-600 hover:bg-blue-700 transition duration-300 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Price Entry
        </button>
      </form>
    </div>
  );
}
