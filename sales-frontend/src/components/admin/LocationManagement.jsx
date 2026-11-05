import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from '../../services/api';

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [bas, setBas] = useState([]);
  const [selectedBaForLoc, setSelectedBaForLoc] = useState(null); // BA whose location is being changed
  const [newLocationId, setNewLocationId] = useState("");
  const [msg, setMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");

  // Fetch Locations & BAs safely
  const fetchData = async () => {
    try {
      const locRes = await axios.get(`${API_URL}manage_locations.php`);
      console.log("Locations API Response:", locRes.data);

      const baRes = await axios.get(`${API_URL}manage_bas.php`);
      console.log("BAs API Response:", baRes.data);

      // Handle locations array safely
      if (Array.isArray(locRes.data)) {
        setLocations(locRes.data);
      } else if (locRes.data?.locations) {
        setLocations(locRes.data.locations);
      } else if (locRes.data?.data) {
        setLocations(locRes.data.data);
      }

      // Handle BAs array safely
      const baData = baRes.data?.bas || baRes.data?.users || baRes.data;
      if (Array.isArray(baData)) {
        setBas(baData);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBas = bas.filter((ba) => {
    const name = ba.name || ba.ba_name || "";
    const username = ba.username || ba.ba_username || "";
    const locationName = ba.location_name || "Not Assigned";
    const matchesSearch = `${name} ${username} ${locationName}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesLocation =
      locationFilter === "ALL" ||
      (locationFilter === "UNASSIGNED"
        ? !ba.location_id && !ba.location_name
        : String(ba.location_id) === locationFilter);

    return matchesSearch && matchesLocation;
  });

  // Handle Location Change Submit
  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!selectedBaForLoc || !newLocationId) {
      setMsg("❌ Please select a location!");
      return;
    }

    const baIdToUpdate = selectedBaForLoc.id || selectedBaForLoc.ba_id;

    try {
      const res = await axios.post(`${API_URL}manage_locations.php`, {
        action: "update_ba_location",
        ba_id: baIdToUpdate,
        location_id: newLocationId,
      });

      if (res.data.status === "success") {
        setMsg(
          `✅ ${selectedBaForLoc.name || selectedBaForLoc.ba_name || "BA"} ki location update ho gayi hai!`,
        );
        setSelectedBaForLoc(null);
        setNewLocationId("");
        fetchData(); // Reload updated list
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg(`❌ ${res.data.message || "Failed to update location"}`);
      }
    } catch (err) {
      console.error("Update error:", err);
      setMsg("❌ Network Error while updating location!");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <span className="bg-teal-500/20 text-teal-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
          Fleet Allocation
        </span>
        <h2 className="text-3xl font-black mt-2 tracking-tight">
          Location & Store Management
        </h2>
        <p className="text-slate-300 text-xs mt-1">
          Manage retail store outlets and assign/change Brand Ambassadors to
          active locations.
        </p>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl text-xs font-black ${msg.includes("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
        >
          {msg}
        </div>
      )}

      {/* BA Location Assignment Directory */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="font-black text-slate-900 text-lg">
            Active Brand Ambassador Allocations
          </h3>
          <p className="text-xs text-slate-400">
            Change store location assignment for any Brand Ambassador anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search BA, username, location..."
            aria-label="Search BA location assignments"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter ambassadors by location"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All locations</option>
            <option value="UNASSIGNED">Not assigned</option>
            {locations.map((location) => (
              <option key={location.id} value={String(location.id)}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3">Ambassador Name</th>
                <th className="py-3.5 px-3">Username</th>
                <th className="py-3.5 px-3">Current Assigned Location</th>
                <th className="py-3.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBas.map((ba, idx) => (
                <tr key={ba.id || ba.ba_id || idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-3 font-black text-slate-900">
                    👤 {ba.name || ba.ba_name}
                  </td>
                  <td className="py-4 px-3 text-xs text-slate-400 font-bold">
                    @{ba.username || ba.ba_username || "ba_user"}
                  </td>
                  <td className="py-4 px-3 font-bold text-teal-700">
                    <span className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100">
                      📍 {ba.location_name || "Not Assigned"}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedBaForLoc(ba);
                        setNewLocationId(ba.location_id || "");
                      }}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-sm"
                    >
                      Change Location 📍
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBas.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-8 text-xs font-bold text-slate-400"
                  >
                    No matching Brand Ambassadors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CHANGE LOCATION MODAL */}
      {selectedBaForLoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  Change BA Location
                </h3>
                <p className="text-xs text-slate-400">
                  Reassigning location for{" "}
                  {selectedBaForLoc.name || selectedBaForLoc.ba_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedBaForLoc(null)}
                className="bg-slate-100 text-slate-600 font-black rounded-xl w-8 h-8 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Select New Location
                </label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  required
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  <option value="">-- Choose New Store Outlet --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      📍 {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedBaForLoc(null)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-black text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-2xl font-black text-xs transition shadow-md"
                >
                  Save New Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}