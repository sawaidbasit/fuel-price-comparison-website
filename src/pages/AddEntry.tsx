// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { AddPriceEntry } from "../components/AddPriceEntry";

// export default function AddEntry({closeModal }: {closeModal: () => void}) {
//   const navigate = useNavigate();
//   const [stationName, setStationName] = useState("");
//   const [location, setLocation] = useState("");
//   const [petrolPrice, setPetrolPrice] = useState("");
//   const [dieselPrice, setDieselPrice] = useState("");

//   // const handleSubmit = async (e: React.FormEvent) => {
//   //   e.preventDefault();

//   //   // Backend API call to save data
//   //   const newEntry = {
//   //     name: stationName,
//   //     location,
//   //     petrol_price: petrolPrice,
//   //     diesel_price: dieselPrice,
//   //     last_updated: new Date().toISOString(),
//   //   };

//   //   console.log("Saving entry:", newEntry);

//   //   // After saving, redirect to home
//   //   navigate("/");
//   // };

//   return (
//     <AddPriceEntry/>
//   );
// }
