import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../lib/supabaseClient";
import { z } from "zod";

const priceEntrySchema = z.object({
  stationName: z.string().min(1, "Station name is required"),
  location: z.string().min(1, "Location is required"),
  petrolPrice: z
    .number({ invalid_type_error: "Petrol price must be a number" })
    .optional(),
  dieselPrice: z
    .number({ invalid_type_error: "Diesel price must be a number" })
    .optional(),
  kerosenePrice: z
    .number({ invalid_type_error: "Kerosene price must be a number" })
    .optional(),
  effectiveDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

type PriceEntry = z.infer<typeof priceEntrySchema>;

const initialFormState: PriceEntry = {
  stationName: "",
  location: "",
  petrolPrice: undefined,
  dieselPrice: undefined,
  kerosenePrice: undefined,
  effectiveDate: new Date().toISOString().split("T")[0],
};

interface AddPriceEntryProps {
  closeModal: () => void;
  onSuccess: (newEntry: any) => void;
}

export function AddPriceEntry({ closeModal, onSuccess }: AddPriceEntryProps) {
  const [formData, setFormData] = useState<PriceEntry>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : 
      name.includes("Price") ? 
      parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const validationResult = priceEntrySchema.safeParse(formData);
      if (!validationResult.success) {
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

      const petrolPrice = formData.petrolPrice ?? null;
      const dieselPrice = formData.dieselPrice ?? null;
      const kerosenePrice = formData.kerosenePrice ?? null;

      const priceData = [
          { tableName: "petrol_prices", price: petrolPrice },
          { tableName: "diesel_prices", price: dieselPrice },
          { tableName: "kerosene_prices", price: kerosenePrice },
      ];

      const allInsertedData: any[] = [];

      for (const { tableName, price } of priceData) {
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
        toast.error(`Failed to add price entry in ${tableName}: ${error.message}`);
        setLoading(false);
        return;
      }
      allInsertedData.push(data);
      }

      toast.success("Price entries added successfully to all tables!");
      onSuccess(allInsertedData);
      setFormData(initialFormState);
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Diesel Price (₦/L)
            </label>
            <input
              type="number"
              name="dieselPrice"
              value={formData.dieselPrice}
              onChange={handleInputChange}
              placeholder="Enter diesel price"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Kerosene Price (₦/L)
            </label>
            <input
              type="number"
              name="kerosenePrice"
              value={formData.kerosenePrice}
              onChange={handleInputChange}
              placeholder="Enter kerosene price"
              className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
            />
          </div>
  

        {/* <div>
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
        </div> */}

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
