import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost/sales-management-system/sales_backend/';

export default function LocationManagement() {
  const [locations, setLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState('');

  const fetchLocations = () => {
    axios.get(`${API_URL}manage_locations.php`)
      .then(res => {
        if (res.data.status === 'success') {
          setLocations(res.data.locations);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.trim()) return;

    try {
      const res = await axios.post(`${API_URL}manage_locations.php`, {
        action: 'add',
        name: newLocation.trim()
      });

      if (res.data.status === 'success') {
        setMsg('✅ Location added successfully!');
        setNewLocation('');
        fetchLocations();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(`❌ ${res.data.message}`);
      }
    } catch (err) {
      setMsg('❌ Network error!');
    }
  };

  const handleDeleteLocation = async (id, name) => {
    if (!window.confirm(`Kya aap "${name}" location ko delete karna chahte hain?`)) return;

    try {
      const res = await axios.post(`${API_URL}manage_locations.php`, {
        action: 'delete',
        id: id
      });

      if (res.data.status === 'success') {
        fetchLocations();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Network error while deleting.");
    }
  };

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <span className="bg-teal-500/20 text-teal-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
          Branch Control
        </span>
        <h2 className="text-3xl font-black mt-2 tracking-tight">Store Locations Management</h2>
        <p className="text-slate-300 text-xs mt-1">Add new store branches, manage regional locations, and monitor active retail stores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Add Location Form */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm h-fit space-y-5">
          <div>
            <h3 className="font-black text-xl text-slate-900">Add New Location</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enter official branch or store name.</p>
          </div>

          {msg && (
            <div className={`p-3.5 rounded-2xl text-xs font-extrabold ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleAddLocation} className="space-y-4 text-xs font-bold text-slate-600">
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Location / Store Name</label>
              <input 
                type="text" 
                value={newLocation} 
                onChange={(e) => setNewLocation(e.target.value)} 
                required 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition" 
                placeholder="e.g. Imtiaz Super Market - Clifton" 
              />
            </div>
            <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded-2xl font-black text-xs transition shadow-lg mt-2">
              + Add Store Location
            </button>
          </form>
        </div>

        {/* Existing Locations Table */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-xl text-slate-900">Active Locations</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total Registered Branches: {locations.length}</p>
            </div>
            <input 
              type="text" 
              placeholder="🔍 Search location..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 w-full sm:w-56 focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm font-bold"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-2">
            {filteredLocations.map((loc) => (
              <div key={loc.id} className="py-4 flex items-center justify-between hover:bg-slate-50/80 transition px-3 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-black text-teal-700 text-sm shadow-sm">
                    📍
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{loc.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Location ID: #{loc.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteLocation(loc.id, loc.name)} 
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-2xl font-black transition border border-rose-200 shadow-sm"
                >
                  Delete
                </button>
              </div>
            ))}
            {filteredLocations.length === 0 && (
              <p className="text-center py-12 text-xs font-bold text-slate-400">No matching locations found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}