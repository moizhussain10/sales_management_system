import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function BAManagement({ baList = [], setBaList, onCreateBA }) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [msg, setMsg] = useState('');

  // Fetch dynamic locations from database
  useEffect(() => {
    axios.get(`${API_URL}get_products.php`)
      .then(res => {
        if (res.data.status === 'success') {
          setLocations(res.data.locations || []);
          if (res.data.locations && res.data.locations.length > 0) {
            setLocationId(res.data.locations[0].id);
          }
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await onCreateBA({ name, username, password, location_id: locationId });
    if (res.status === 'success') {
      setMsg('✅ BA Account successfully created!');
      setName('');
      setUsername('');
      setPassword('');
      setTimeout(() => setMsg(''), 3000);
    } else {
      setMsg(`❌ ${res.message || 'Failed to create account'}`);
    }
  };

  const handleDeleteBA = async (id) => {
    if (!window.confirm("Kya aap waqai is Brand Ambassador ka account delete karna chahte hain?")) return;
    try {
      const res = await axios.post(`${API_URL}delete_ba.php`, { id });
      if (res.data.status === 'success') {
        if (setBaList) {
          setBaList(prev => prev.filter(ba => ba.id !== id));
        } else {
          window.location.reload();
        }
      } else {
        alert(res.data.message || "Failed to delete BA.");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Server connection error while deleting. Check console for details.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <span className="bg-teal-500/20 text-teal-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
          Fleet Management
        </span>
        <h2 className="text-3xl font-black mt-2 tracking-tight">Brand Ambassador Accounts</h2>
        <p className="text-slate-300 text-xs mt-1">Create accounts, assign secure credentials, and manage store location mappings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm h-fit space-y-5">
          <div>
            <h3 className="font-black text-xl text-slate-900">Create New BA Account</h3>
            <p className="text-xs text-slate-400 mt-0.5">Assign credentials and designated store location.</p>
          </div>

          {msg && (
            <div className={`p-3.5 rounded-2xl text-xs font-extrabold ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-600">
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition" 
                placeholder="e.g. Ali Khan" 
              />
            </div>
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition" 
                placeholder="e.g. ali_ba" 
              />
            </div>
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition" 
                placeholder="••••••••" 
              />
            </div>
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Assigned Store Location</label>
              <select 
                value={locationId} 
                onChange={(e) => setLocationId(e.target.value)} 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition"
                required
              >
                <option value="">Select store location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded-2xl font-black text-xs transition shadow-lg mt-2">
              + Create Ambassador Account
            </button>
          </form>
        </div>

        {/* Existing BA Accounts */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-xl text-slate-900">Active Representatives</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total Registered Fleet: {baList.length}</p>
            </div>
            <span className="text-xs bg-teal-50 text-teal-700 font-black px-4 py-2 rounded-2xl border border-teal-100 shadow-sm">
              🟢 Live Fleet
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
            {baList.map((ba) => (
              <div key={ba.id} className="py-4 flex items-center justify-between hover:bg-slate-50/80 transition px-3 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-black text-teal-700 text-base shadow-sm">
                    {ba.name ? ba.name[0].toUpperCase() : 'B'}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{ba.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">@{ba.username} &nbsp;·&nbsp; 
                      <span className="text-teal-700 font-bold">📍 {ba.location_name || 'Assigned Store'}</span>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteBA(ba.id)} 
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2.5 rounded-2xl font-black transition border border-rose-200 shadow-sm"
                >
                  Revoke Access
                </button>
              </div>
            ))}
            {baList.length === 0 && (
              <p className="text-center py-12 text-xs font-bold text-slate-400">No active Brand Ambassadors found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}