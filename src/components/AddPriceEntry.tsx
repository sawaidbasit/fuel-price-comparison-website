import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../lib/supabaseClient";
import { z } from "zod";
// import Papa from "papaparse";

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
  onSuccess: (entry: any) => void;
  existingEntry?: {
    id: string;
    station_name: string;
    station_location: string;
    price: number;
    effective_date: string;
    fuel_type: "petrol" | "diesel" | "kerosene";
  };
  isAdmin: boolean;
  userEmail?: string;
}

export function AddPriceEntry({ 
  closeModal, 
  onSuccess, 
  existingEntry,
  isAdmin,
  userEmail 
}: AddPriceEntryProps) {
  const [formData, setFormData] = useState<PriceEntry>(() => {
    if (existingEntry) {
      return {
        stationName: existingEntry.station_name,
        location: existingEntry.station_location,
        petrolPrice: existingEntry.fuel_type === "petrol" ? existingEntry.price : undefined,
        dieselPrice: existingEntry.fuel_type === "diesel" ? existingEntry.price : undefined,
        kerosenePrice: existingEntry.fuel_type === "kerosene" ? existingEntry.price : undefined,
        effectiveDate: existingEntry.effective_date,
      };
    }
    return initialFormState;
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);

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

  const notifyAdmin = async () => {
    try {
      await fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          stationName: formData.stationName,
          location: formData.location,
          petrolPrice: formData.petrolPrice,
          dieselPrice: formData.dieselPrice,
          kerosenePrice: formData.kerosenePrice
        })
      });
    } catch (error) {
      console.error('Failed to notify admin:', error);
    }
  };

  async function uploadParsedEntries(entries: Record<string, string>[]) {
      console.log("Uploading entries:", entries); // ✅ Debug log
  for (const entry of entries) {
    const { stationName, location, petrolPrice, dieselPrice, kerosenePrice, effectiveDate } = entry;

    // Conditionally insert into the correct table(s)
    if (petrolPrice) {
      await supabase.from("petrol_prices").insert({
        stationName,
        location,
        price: Number(petrolPrice),
        effectiveDate,
      });
    }
    if (dieselPrice) {
      await supabase.from("diesel_prices").insert({
        stationName,
        location,
        price: Number(dieselPrice),
        effectiveDate,
      });
    }
    if (kerosenePrice) {
      await supabase.from("kerosene_prices").insert({
        stationName,
        location,
        price: Number(kerosenePrice),
        effectiveDate,
      });
    }
  }
}


  function handleCSVUpload(event: React.ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const parsedData = parseCSV(text);
    console.log("Parsed CSV:", parsedData);
    uploadParsedEntries(parsedData);

  };
  reader.readAsText(file);
}


function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] ?? "";
    });
    return obj;
  });
}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading(isAdmin ? "Adding price entries..." : "Submitting for approval...");
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

      if (isAdmin) {
        // Admin can directly add to the main tables
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
          if (price !== null) {
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

            if (error) throw error;
            allInsertedData.push(data);
          }
        }

        toast.success("Price entries added successfully!");
        onSuccess(allInsertedData);
      } else {
        // Regular users create pending submissions
        const { data, error } = await supabase
          .from('submissions')
          .insert([
            {
              station_name: formData.stationName,
              station_location: formData.location,
              petrol_price: formData.petrolPrice,
              diesel_price: formData.dieselPrice,
              kerosene_price: formData.kerosenePrice,
              effective_date: formData.effectiveDate,
              submitted_by: userEmail,
              status: 'pending'
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Notify admin
        await notifyAdmin();
        toast.success(
          "Submission sent for admin approval! You'll be notified when reviewed.",
          { id: toastId, duration: 5000 }
        );
        onSuccess(data);
      }

      setFormData(initialFormState);
      closeModal();
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error(error.message || "Something went wrong. Please try again.",
        { id: toastId, duration: 5000 }
      );
    } finally {
      setLoading(false);
    }
  };    

  return (
    <div className="max-w-2xl mx-auto p-3 bg-white rounded-2xl">
      <Toaster position="top-right" />

      {!isAdmin && (    
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-yellow-700">
            Your submission will be reviewed by an admin before being published.
          </p>
        </div>
      )}

{isAdmin && (
  <div className="mt-6">
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      Upload CSV File
    </label>
    <input
      type="file"
      accept=".csv"
      onChange={handleCSVUpload}
      className="mb-4 w-full border rounded px-4 py-2"
    />
  </div>
)}


      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Existing form fields remain the same */}
        {/* ... */}
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
          ) : isAdmin ? (
            "Add Price Entry"
          ) : (
            "Submit for Approval"
          )}
        </button>
      </form>
    </div>
  );
}