import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { Fuel } from 'lucide-react';

interface FuelStation {
  station_name: string;
  station_location: string;
  fuel_type: 'petrol' | 'diesel' | 'kerosene';
  price: number;
}

interface MergedStation {
  station_name: string;
  petrol?: number;
  diesel?: number;
  kerosene?: number;
}

const StationListingPage = () => {
  const { stateName } = useParams();
  const [groupedData, setGroupedData] = useState<Record<string, MergedStation[]>>({});
  const [loading, setLoading] = useState(false);

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };
  

  const fetchData = async () => {
    setLoading(true);
    try {
      const tables = ['petrol_prices', 'diesel_prices', 'kerosene_prices'];
      const fuelTypeMap = {
        petrol_prices: 'petrol',
        diesel_prices: 'diesel',
        kerosene_prices: 'kerosene',
      };

      const results = await Promise.all(
        tables.map(async (table) => {
          const { data, error } = await supabase.from(table).select('*');
          if (error) {
            console.error(`Error fetching ${table}:`, error);
            return [];
          }
          return (data || []).map((item) => ({
            station_name: item.station_name,
            station_location: item.station_location,
            fuel_type: fuelTypeMap[table],
            price: item.price,
          }));
        })
      );

      const allData: FuelStation[] = results.flat();

      const locationMap: Record<string, Record<string, MergedStation>> = {};

      allData.forEach((item) => {
        const loc = item.station_location;
        const name = item.station_name;

        if (!locationMap[loc]) locationMap[loc] = {};
        if (!locationMap[loc][name]) {
          locationMap[loc][name] = { station_name: name };
        }

        locationMap[loc][name][item.fuel_type] = item.price;
      });

      const finalGrouped: Record<string, MergedStation[]> = {};
      for (const loc in locationMap) {
        finalGrouped[loc] = Object.values(locationMap[loc]);
      }

      const onlyThisLocation = Object.keys(finalGrouped).find(
        (loc) => slugify(loc) === stateName?.toLowerCase()
      );
      
      
      if (onlyThisLocation) {
        setGroupedData({ [onlyThisLocation]: finalGrouped[onlyThisLocation] });
      } else {
        setGroupedData({});
      }
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [stateName]);
  
  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : Object.keys(groupedData).length === 0 ? (
        <p className="text-center text-gray-600">No stations found.</p>
      ) : (
        Object.entries(groupedData).map(([location, stations]) => (
          <div key={location} className="mb-12">
            <h1 className="text-3xl font-bold text-green-600 mb-4">
              {location}
            </h1>

            <div className="max-sm:hidden ">
              <div className="overflow-x-auto mt-6 bg-white rounded-xl shadow-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-lg font-bold text-gray-700">
                        Station Name
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-gray-700">
                        Petrol
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-gray-700">
                        Diesel
                      </th>
                      <th className="px-6 py-4 text-left text-lg font-bold text-gray-700">
                        Kerosene
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    {stations.map((station, index) => (
                      <tr key={index} className="hover:bg-zinc-50 transition">
                        <td className="px-6 py-4 text-gray-900 font-medium flex items-center gap-2">
                          <Fuel className="w-8 h-6 text-blue-500" />
                          {station.station_name}
                        </td>
                        <td className="px-6 py-4 font-semibold text-green-600">
                          {station.petrol ? `₦${station.petrol}/L` : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-semibold">
                          {station.diesel ? `₦${station.diesel}/L` : "N/A"}
                        </td>
                        <td className="px-6 py-4 text-green-600 font-semibold">
                          {station.kerosene ? `₦${station.kerosene}/L` : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="max-sm:block hidden">
              {stations.map((station, index) => (
                <div
                  key={index}
                  className="mt-6 p-6 bg-white rounded-xl shadow-xl border border-gray-200"
                >
                  <h3 className="text-2xl text-gray-900 font-bold flex items-center gap-1">
                    <Fuel className="w-10 h-8 text-blue-500" />
                    {station.station_name}
                  </h3>

                  <div className="mt-5">
                    <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2 mt-3">
                      <span className="text-gray-600 font-medium">Petrol</span>
                      <span className="text-lg font-bold text-green-600">
                        {station.petrol ? `₦${station.petrol}/L` : "NA"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2 mt-3">
                      <span className="text-gray-600 font-medium">Diesel</span>
                      <span className="text-lg font-bold text-green-600">
                        {station.diesel ? `₦${station.diesel}/L` : "NA"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-200 rounded-lg px-4 py-2 mt-3">
                      <span className="text-gray-600 font-medium">
                        Kerosene
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {station.kerosene ? `₦${station.kerosene}/L` : "NA"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default StationListingPage;
