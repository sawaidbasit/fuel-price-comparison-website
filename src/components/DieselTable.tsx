import { ArrowDown, ArrowUp, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface FuelStation {
  id: number;
  station_name: string;
  station_location: string;
  fuel_type: "petrol" | "diesel" | "kerosene";
  price: number;
  tags: [];
  last_updated: string;
  effective_date?: string;
}

export default function DieselTable({ data }: { data: FuelStation[] }) {
  const [sortedData, setSortedData] = useState(data);
  const [ascending, setAscending] = useState(true);

  useEffect(() => {
    setSortedData(data);
  }, [data]);

  const sortByPrice = () => {
    setAscending(!ascending);
  };

  // Pehle filter, phir sort
  const filteredData = data.sort((a, b) => (ascending ? a.price - b.price : b.price - a.price));

  return (
    <div className="relative flex justify-center border-1">
      <div className="w-full flex justify-center relative z-10">
        <svg
          viewBox="0 0 128 128"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          aria-hidden="true"
          role="img"
          className="iconify iconify--noto"
          preserveAspectRatio="xMidYMid meet"
          fill="#000000"
        >
          <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
          <g
            id="SVGRepo_tracerCarrier"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></g>
          <g id="SVGRepo_iconCarrier">
            {" "}
            <path
              d="M79.69 62.69c7.36 15.65 30.45 32.94 32.41 42.77c1.34 6.7-3.33 12.26-9.19 11.2c-6.6-1.19-6.91-10.69-4.31-17.99c6.54-18.38 8.79-28.99 6.53-38.95l-1.08-4.68"
              fill="none"
              stroke="#616161"
              strokeWidth="6"
              strokeMiterlimit="10"
            >
              {" "}
            </path>{" "}
            <path
              d="M80.82 56.1c-1.87 0-1.14-1.61-1.14-3.6V25.92c0-1.99-.73-3.6 1.14-3.6s5.12 1.11 5.12 3.6V52.5c0 1.99-3.25 3.6-5.12 3.6z"
              fill="#757575"
            >
              {" "}
            </path>{" "}
            <path
              d="M82.1 113.93V27.96C82.1 14.73 71.37 4 58.14 4H34.96C21.72 4 11 14.73 11 27.96v85.97c-3.3.97-5.71 4.02-5.71 7.63v.3c0 1.18.96 2.14 2.14 2.14h78.24c1.18 0 2.14-.96 2.14-2.14v-.3a7.95 7.95 0 0 0-5.71-7.63z"
              fill="#facc15"
            >
              {" "}
            </path>{" "}
            <path
              d="M65.68 56.57H26.93c-1.77 0-3.21-1.44-3.21-3.21V22.42c0-1.77 1.44-3.21 3.21-3.21h38.75c1.77 0 3.21 1.44 3.21 3.21v30.93a3.21 3.21 0 0 1-3.21 3.22z"
              fill="#757575"
            >
              {" "}
            </path>{" "}
            <path fill="#757575" d="M32.22 29.6h29.31v7.64H32.22z">
              {" "}
            </path>{" "}
            <path fill="#757575" d="M32.22 41.36h29.31V49H32.22z">
              {" "}
            </path>{" "}
            <path
              d="M24.13 47c-.05.52-.81.52-.86.01c-.74-7.27-1.16-14.55-1.48-21.82c-.47-4.02 2.63-7.49 6.78-7.21c11.79-.35 23.64-.35 35.43-.01c4.14-.28 7.27 3.19 6.79 7.21c-.32 7.28-.75 14.57-1.49 21.85c-.05.52-.81.52-.86 0c-.77-7.53-1.19-15.07-1.53-22.59a2.11 2.11 0 0 0-.09-.45c-.25-.9-1.12-1.65-2.02-1.56c-.48.02-36.58.01-37.04-.01c-.9-.09-1.77.66-2.02 1.57c-.04.15-.07.3-.09.45c-.34 7.51-.75 15.04-1.52 22.56z"
              fill="#757575"
            >
              {" "}
            </path>{" "}
            <ellipse cx="46.31" cy="84.08" rx="16.79" ry="17.89" fill="#f5f5f5">
              {" "}
            </ellipse>{" "}
            <path
              d="M38.87 86.6c0-4.37 7.43-12.95 7.43-12.95s7.43 8.58 7.43 12.95s-3.33 7.92-7.43 7.92s-7.43-3.55-7.43-7.92z"
              fill="#757575"
            >
              {" "}
            </path>{" "}
            <path fill="#757575" d="M11 110.03h71.1v3.89H11z">
              {" "}
            </path>{" "}
            <path
              d="M17.45 22.04c.88-4.96 5.2-11.1 14.13-11.1"
              fill="none"
              stroke="#757575"
              strokeWidth="5"
              strokeLinecap="round"
              strokeMiterlimit="10"
            >
              {" "}
            </path>{" "}
            <g>
              {" "}
              <path
                fill="#757575"
                d="M108.059 58.98l-5.796 1.472l-.955-3.76l5.796-1.472z"
              >
                {" "}
              </path>{" "}
              <path
                d="M104.77 29.85l6.73-12.2c.5-.9 1.16-1.7 1.95-2.35c2.46-2.02 7.97-6.58 9.13-7.84c1.51-1.64-1.29-5.1-3.28-3.73c-1.56 1.08-7.3 6.12-9.69 8.23c-.7.61-1.28 1.34-1.73 2.16l-7.07 12.82l3.96 2.91z"
                fill="#757575"
              >
                {" "}
              </path>{" "}
              <path
                d="M100.66 37.73l9.42-1.95l3.32 11.82c.53 2.08-.43 2.68-2.27 3.15l-6.66 1.85m-5.22-15.27l8.05 18.35l7.62-2.13c3.19-.93 3.1-3.53 2.61-5.46l-3.93-14.4l-14.35 3.64z"
                fill="#757575"
              >
                {" "}
              </path>{" "}
              <path
                d="M103.82 21.12l4.87 2.74c.65.36.89 1.17.56 1.83l-.97 1.94l2.25 1.7a8.565 8.565 0 0 1 3.16 4.77l.27 1.05l-6.96 1.79a2.742 2.742 0 0 0-1.95 3.34l3.21 12.63c.32 1.36.4 2.48-.97 2.78l-5.55 1.38c-1.32.29-2.63-.52-2.96-1.83L94.9 39.95c-1.74-6.85.94-9.17 1.5-10.3s3.5-4.21 3.5-4.21l2.01-3.76c.37-.69 1.23-.94 1.91-.56z"
                fill="#facc15"
              >
                {" "}
              </path>{" "}
              <path
                fill="none"
                stroke="#757575"
                strokeWidth="4"
                strokeLinecap="round"
                strokeMiterlimit="10"
                d="M106.8 29.34l-4.83-2.42"
              >
                {" "}
              </path>{" "}
            </g>{" "}
          </g>
        </svg>
      </div>

      <div className="text-white absolute top-20 mr-24 max-w-[300px] px-4 z-20 text-center">
        <h3 className="text-xl font-semibold">Diesel Price</h3>
        <h1 className="text-xl -mt-1 font-bold">
          $59 <span className="text-md">/lo</span>
        </h1>
        <p className="text-md">PRICE PER LITER</p>
      </div>

      {/* <div className="absolute bottom-0 top-48 mr-20 z-30 w-full max-w-[80%]">
        <table className="w-full border-2 border-[#757575]">
          <thead>
            <tr className="bg-yellow-500 text-white">
              <th className="text-left px-4 py-2 relative">STATION</th>
              <th
                className="hover:text-gray-200 text-center px-4 py-2 cursor-pointer flex items-center justify-center gap-2"
                onClick={sortByPrice}
              >
                PRICE{" "}
                {ascending ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData?.map((station, index) => (
              <tr className="bg-yellow-400 text-white border-b border-[#383838]">
                <td className="px-4 py-2">{station?.station_name}</td>
                <td className="text-center px-4 py-2">${station?.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}
      <div className="absolute bottom-0 top-48 mr-20 z-30 w-full max-w-[80%]">
  <div className="border-2 border-yellow-500 w-full max-w-full">
    <table className="w-full table-fixed">
      {/* Fixed Header */}
      <thead className="bg-yellow-500 text-white w-full">
        <tr>
          <th className="text-left px-4 py-2 w-1/2">STATION</th>
          <th
            className="hover:text-gray-300 text-center px-4 py-2 cursor-pointer flex items-center justify-center gap-2 w-1/2"
            onClick={sortByPrice}
          >
            PRICE {ascending ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </th>
        </tr>
      </thead>
    </table>

    {/* ✅ Scrollable Body - Table Wrapper */}
    <div className="h-[160px] overflow-y-auto custom-scrollbar w-full">
      <table className="w-full table-fixed">
        <tbody>
          {filteredData?.map((station, index) => (
            <tr key={index} className="bg-yellow-400 text-white border-b border-[#383838]">
              <td className="px-4 py-2 w-1/2">{station?.station_name}</td>
              <td className="text-center px-4 py-2 w-1/2">${station?.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
    </div>
  );
}
