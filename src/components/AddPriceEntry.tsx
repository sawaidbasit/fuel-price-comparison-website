import React, { useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../lib/supabaseClient";
import { z } from "zod";
import { parse } from "csv-parse/browser/esm";

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
  userEmail,
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [parsedCSVData, setParsedCSVData] = useState<Record<string, string>[] | null>(null);
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? undefined : name.includes("Price") ? parseFloat(value) : value,
    }));
  };

  const notifyAdmin = async () => {
    try {
      await fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          stationName: formData.stationName,
          location: formData.location,
          petrolPrice: formData.petrolPrice,
          dieselPrice: formData.dieselPrice,
          kerosenePrice: formData.kerosenePrice,
        }),
      });
    } catch (error) {
      console.error("Failed to notify admin:", error);
    }
  };

  const uploadParsedEntries = async (entries: Record<string, string>[]) => {
    for (const entry of entries) {
      const parsedEffectiveDate = new Date(entry.effectiveDate).toISOString();
      const insertOptions = {
        station_name: entry.stationName,
        station_location: entry.location,
        effective_date: parsedEffectiveDate,
        tags: [],
        last_updated: new Date().toISOString(),
      };

      await supabase.from("petrol_prices").insert({
        ...insertOptions,
        price: entry.petrolPrice ? Number(entry.petrolPrice) : null,
      });

      await supabase.from("diesel_prices").insert({
        ...insertOptions,
        price: entry.dieselPrice ? Number(entry.dieselPrice) : null,
      });

      await supabase.from("kerosene_prices").insert({
        ...insertOptions,
        price: entry.kerosenePrice ? Number(entry.kerosenePrice) : null,
      });
    }
  };



  const handleUpload = () => {
    if (parsedData.length > 0) {
      onUpload(parsedData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const toastId = toast.loading(isAdmin ? "Adding price entries..." : "Submitting for approval...");
  try {
    setLoading(true);

    if (parsedCSVData && isAdmin) {
      await uploadParsedEntries(parsedCSVData);
      toast.success("CSV entries uploaded successfully!", { id: toastId });
      setParsedCSVData(null);
      onSuccess(parsedCSVData); // Add this line to trigger UI update
      setTimeout(() => closeModal(), 1000);
      return;
    }

      const validationResult = priceEntrySchema.safeParse(formData);
      if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
        toast.error("Please fix the form errors", { id: toastId });
        setLoading(false);
        return;
      }

      setErrors({});
      const { petrolPrice, dieselPrice, kerosenePrice } = formData;

      if (isAdmin) {
        const entries = [
          { tableName: "petrol_prices", price: petrolPrice },
          { tableName: "diesel_prices", price: dieselPrice },
          { tableName: "kerosene_prices", price: kerosenePrice },
        ];

        const allInsertedData: any[] = [];

        for (const { tableName, price } of entries) {
          if (price !== null && price !== undefined) {
            const { data, error } = await supabase
              .from(tableName)
              .insert([
                {
                  station_name: formData.stationName,
                  station_location: formData.location,
                  price,
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

        toast.success("Price entries added successfully!", { id: toastId });
        onSuccess(allInsertedData);
      } else {
        const { data, error } = await supabase
          .from("submissions")
          .insert([
            {
              station_name: formData.stationName,
              station_location: formData.location,
              petrol_price: petrolPrice,
              diesel_price: dieselPrice,
              kerosene_price: kerosenePrice,
              effective_date: formData.effectiveDate,
              submitted_by: userEmail,
              status: "pending",
            },
          ])
          .select()
          .single();

        if (error) throw error;

        await notifyAdmin();
        toast.success("Submission sent for admin approval!", { id: toastId });
        onSuccess(data);
      }

      setFormData(initialFormState);
      closeModal();
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast.error(error.message || "Something went wrong.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setFileName(file.name);

  const text = await file.text();

  parse(
    text,
    {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    },
    (err, records: Record<string, string>[]) => {
      if (err) {
        console.error("CSV Parse Error:", err);
        toast.error("Failed to parse CSV file");
        return;
      }

      setParsedData(records);
      setParsedCSVData(records);
      toast.success("CSV file parsed successfully");
    }
  );
};


  return (
    <div className="">
      <Toaster position="top-right" />
      {!isAdmin && (    
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
          <p className="text-yellow-700 text-sm">
            Your submission will be reviewed by an admin before being published.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex justify-center mb-4 w-full">
        <button
          className={`w-full px-4 py-2 rounded-l-md ${activeTab === "manual" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("manual")}
        >
          Manual Entry
        </button>
        <button
          className={`w-full px-4 py-2 rounded-r-md ${activeTab === "csv" ? "bg-green-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTab("csv")}
        >
          Upload CSV
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "manual" ? (
          <div className="space-y-6">
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
          {loading ? "Processing..." : "Add Price Entry"}
        </button>
          </div>
        ) : (
          // <input type="file" accept=".csv" onChange={handleCSVUpload} />
          <div className="space-y-4  flex w-full justify-between flex-col  mt-4">
          <div className="space-y-2">
            <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full border text-center mx-auto p-4 rounded-xl text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0 file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
            cursor-pointer"
          />

          {fileName && (
            <div className="text-sm text-gray-700">
              Selected File: <span className="font-medium">{fileName}</span>
            </div>
          )}
          </div>

          <button
            onClick={handleUpload}
            className="w-full flex justify-center items-center gap-2 px-6 py-3 text-white text-lg font-medium rounded-lg 
                bg-green-600 hover:bg-green-700 transition duration-300 shadow-lg"
          disabled={loading || !parsedData.length}
          >
            Upload
          </button>
        </div>
        )}

        
      </form>
    </div>
  );
}
