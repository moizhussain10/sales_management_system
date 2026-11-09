import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from '../../services/api';

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [bas, setBas] = useState([]);
  const [selectedBaForLoc, setSelectedBaForLoc] = useState(null);
  const [newLocationId, setNewLocationId] = useState("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationBaId, setNewLocationBaId] = useState("");
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState(null);
  const [msg, setMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [locationSearch, setLocationSearch] = useState("");

  const fetchData = async () => {
    try {
      const locRes = await axios.get(`${API_URL}manage_locations.php`, { withCredentials: true });
      const baRes = await axios.get(`${API_URL}manage_bas.php`, { withCredentials: true });

      if (Array.isArray(locRes.data)) {
        setLocations(locRes.data);
      } else if (locRes.data?.locations) {
        setLocations(locRes.data.locations);
      }

      const baData = baRes.data?.bas || baRes.data?.users || baRes.data;
      if (Array.isArray(baData)) {
        setBas(baData);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setMsg(err.response?.data?.message || "Could not load location data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    const name = newLocationName.trim();
    if (!name) {
      setMsg("Location name is required.");
      return;
    }

    setIsAddingLocation(true);
    try {
      const res = await axios.post(`${API_URL}manage_locations.php`, {
        action: "add",
        name,
        ba_id: newLocationBaId || null,
      }, { withCredentials: true });

      if (res.data.status === "success") {
        setMsg(res.data.message || "Location added successfully.");
        setNewLocationName("");
        setNewLocationBaId("");
        await fetchData();
      } else {
        setMsg(res.data.message || "Failed to add location.");
      }
    } catch (err) {
      console.error("Add location error:", err);
      setMsg(err.response?.data?.message || "Failed to add location.");
    } finally {
      setIsAddingLocation(false);
    }
  };

  const handleDeleteLocation = async (location) => {
    const usageCount = Number(location.assigned_ba_count || 0)
      + Number(location.inventory_item_count || 0)
      + Number(location.sales_count || 0);
    if (usageCount > 0) return;
    if (!window.confirm(`Delete the location "${location.name}"?`)) return;

    setDeletingLocationId(String(location.id));
    try {
      const res = await axios.post(`${API_URL}manage_locations.php`, {
        action: "delete",
        id: location.id,
      }, { withCredentials: true });
      if (res.data.status === "success") {
        setMsg(`Location "${location.name}" deleted.`);
        await fetchData();
      } else {
        setMsg(res.data.message || "Could not delete this location.");
      }
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not delete this location.");
    } finally {
      setDeletingLocationId(null);
    }
  };

  const filteredLocations = locations.filter((location) =>
    String(location.name || "").toLowerCase().includes(locationSearch.trim().toLowerCase()),
  );

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

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!selectedBaForLoc || !newLocationId) {
      setMsg("Please select a location.");
      return;
    }

    const baIdToUpdate = selectedBaForLoc.id || selectedBaForLoc.ba_id;

    try {
      const res = await axios.post(`${API_URL}manage_locations.php`, {
        action: "update_ba_location",
        ba_id: baIdToUpdate,
        location_id: newLocationId,
      }, { withCredentials: true });

      if (res.data.status === "success") {
        setMsg(`${selectedBaForLoc.name || selectedBaForLoc.ba_name || "BA"} moved to the selected location.`);
        setSelectedBaForLoc(null);
        setNewLocationId("");
        fetchData();
        setTimeout(() => setMsg(""), 3000);
      } else {
        setMsg(res.data.message || "Failed to update location.");
      }
    } catch (err) {
      console.error("Update error:", err);
      setMsg(err.response?.data?.message || "Could not update the BA location.");
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30 w-10000000000%">
          <span className="inline-block px-3 py-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 rounded-md border border-teal-100">
            Fleet Management
          </span>
          <h2 className="text-3xl font-black text-slate-50 tracking-tight">Locations & Territories</h2>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">Manage store outlets and Brand Ambassador assignments seamlessly.</p>
        </div>
      <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600 animate-pulse" />
          {locations.length} {locations.length === 1 ? "Active Location" : "Active Locations"}
        </div>
      </header>

      {/* Notification Banner */}
      {msg && (
        <div
          role="status"
          className={`px-5 py-4 rounded-2xl text-sm font-semibold border shadow-sm transition-all ${
            /added|deleted|moved|success/i.test(msg) && !/failed|could not|error/i.test(msg)
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          {msg}
        </div>
      )}

      {/* Store Directory Card */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 sm:flex-row sm:items-end sm:justify-between bg-slate-50/50">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Store Directory</span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">Locations and Assignments</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Create a store outlet and optionally assign a BA straight away.</p>
          </div>
          <input
            type="search"
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
            placeholder="Search locations..."
            aria-label="Search locations"
            className="w-full sm:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-700/10 shadow-sm transition"
          />
        </div>

        {/* Add Location Form */}
        <form onSubmit={handleAddLocation} className="grid gap-5 border-b border-slate-100 bg-white p-8 lg:grid-cols-[minmax(240px,1fr)_minmax(280px,1fr)_auto] lg:items-end">
          <div>
            <label htmlFor="new-location-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Location Name
            </label>
            <input
              id="new-location-name"
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="e.g. Dolmen Mall Clifton"
              maxLength={100}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-700/10 transition"
            />
          </div>
          <div>
            <label htmlFor="new-location-ba" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
              Assign a BA Now <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <select
              id="new-location-ba"
              value={newLocationBaId}
              onChange={(e) => setNewLocationBaId(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-700/10 transition"
            >
              <option value="">Create without assigning a BA</option>
              {bas.map((ba) => (
                <option key={ba.id || ba.ba_id} value={ba.id || ba.ba_id}>
                  {ba.name || ba.ba_name || ba.username} · {ba.location_name || "Unassigned"}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isAddingLocation}
            className="inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-teal-700 px-7 py-3 text-sm font-black text-white transition hover:bg-teal-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 shadow-lg shadow-teal-700/20"
          >
            {isAddingLocation ? "Creating..." : "+ Create Location"}
          </button>
        </form>

        {/* Locations Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/80">
                <th className="px-8 py-4">Location Outlet</th>
                <th className="px-4 py-4 text-right">Assigned BAs</th>
                <th className="px-4 py-4 text-right">Stock Records</th>
                <th className="px-4 py-4 text-right">Sales Count</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLocations.map((location) => {
                const usageCount = Number(location.assigned_ba_count || 0)
                  + Number(location.inventory_item_count || 0)
                  + Number(location.sales_count || 0);
                const isInUse = usageCount > 0;
                return (
                  <tr key={location.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-8 py-4 font-black text-slate-900 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-teal-600"></span> {location.name}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-slate-700 tabular-nums">{location.assigned_ba_count || 0}</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-700 tabular-nums">{location.inventory_item_count || 0}</td>
                    <td className="px-4 py-4 text-right font-bold text-slate-700 tabular-nums">{location.sales_count || 0}</td>
                    <td className="px-8 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(location)}
                        disabled={isInUse || deletingLocationId === String(location.id)}
                        title={isInUse ? "Reassign BAs and remove stock first. Locations with sales history are retained." : "Delete location"}
                        className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-black text-rose-700 hover:bg-rose-50 transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white shadow-sm"
                      >
                        {deletingLocationId === String(location.id) ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredLocations.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-sm font-semibold text-slate-400">
                    {locations.length ? "No locations match your search." : "No locations yet. Add your first store outlet above."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-8 py-4 text-xs font-medium text-slate-500 bg-slate-50/50">
          Note: Locations with assigned BAs, stock, or sales history can’t be deleted. Reassign BAs and remove stock first.
        </div>
      </section>

      {/* BA Assignment Directory Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 space-y-6">
        <div>
          <h3 className="font-black text-slate-900 text-xl tracking-tight">
            Assign Brand Ambassadors
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Choose a BA and assign or move them securely to any active store location.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by BA name, username, or location..."
            aria-label="Search BA location assignments"
            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-700/10 transition shadow-sm"
          />
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter ambassadors by location"
            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-700/10 transition shadow-sm"
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
              <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider bg-slate-50/80">
                <th className="py-4 px-6">Ambassador Name</th>
                <th className="py-4 px-6">Username</th>
                <th className="py-4 px-6">Current Assigned Location</th>
                <th className="py-4 px-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBas.map((ba, idx) => (
                <tr key={ba.id || ba.ba_id || idx} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-6 font-black text-slate-900">
                    {ba.name || ba.ba_name}
                  </td>
                  <td className="py-4 px-6 text-xs font-bold text-slate-500 font-mono">
                    @{ba.username || ba.ba_username || "ba_user"}
                  </td>
                  <td className="py-4 px-6 font-bold text-teal-800">
                    <span className="bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-100 text-xs shadow-2xs">
                      📍 {ba.location_name || "Not Assigned"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => {
                        setSelectedBaForLoc(ba);
                        setNewLocationId(ba.location_id || "");
                      }}
                      className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-teal-700/15 active:scale-95"
                    >
                      Change Location 📍
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBas.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-xs font-bold text-slate-400">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">
                  Change BA Location
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Reassigning location for <span className="font-bold text-slate-800">{selectedBaForLoc.name || selectedBaForLoc.ba_name}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedBaForLoc(null)}
                className="bg-slate-100 text-slate-500 font-black rounded-xl w-9 h-9 flex items-center justify-center text-xs hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateLocation} className="space-y-5">
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-2">
                  Select New Store Outlet
                </label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  required
                  className="w-full p-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-800 text-xs font-bold focus:bg-white focus:outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-700/10 shadow-sm transition"
                >
                  <option value="">-- Choose Store Outlet --</option>
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
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-black text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-teal-700 hover:bg-teal-800 text-white py-3.5 rounded-2xl font-black text-xs transition shadow-lg shadow-teal-700/20 active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}