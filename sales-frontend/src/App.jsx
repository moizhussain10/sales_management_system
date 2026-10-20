import React, { useState } from 'react';
import { loginUser } from './services/api';
import AdminLayout from './components/admin/AdminLayout';
import BASalesEntry from './components/BASalesEntry';

export default function App() {
  // LocalStorage se check kar rahe hain ke pehle se user login hai ya nahi
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sales_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({ username, password });
      if (res.status === 'success') {
        setUser(res.user);
        // Login success hone par user data localStorage mein save kar diya
        localStorage.setItem('sales_user', JSON.stringify(res.user));
      } else {
        setError(res.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('Server connection failed. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    // Logout par localStorage se data remove kar diya
    localStorage.removeItem('sales_user');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(13,148,136,0.25),rgba(255,255,255,0))] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
            {/* Top Glowing Accent */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none"></div>

            {/* Logo / Header Section */}
            <div className="text-center mb-8 relative">
              <div className="w-16 h-16 bg-gradient-to-tr from-teal-600 to-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20 ring-4 ring-slate-800/60">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Bloom Effekt</h2>
              <p className="text-xs font-medium text-slate-400 mt-1">Sales Management & Analytics Portal</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Username
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="Enter your username"
                    className="w-full pl-4 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition shadow-inner" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                    className="w-full pl-4 pr-4 py-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition shadow-inner" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 active:scale-[0.99] text-white font-bold text-xs py-4 rounded-2xl shadow-lg shadow-teal-900/40 transition-all duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard →</span>
                )}
              </button>
            </form>

            {/* Footer Text */}
            <div className="mt-8 text-center border-t border-slate-800/80 pt-4">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Protected System • Authorized Access Only
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return <AdminLayout onLogout={handleLogout} />;
  }

  return <BASalesEntry user={user} onLogout={handleLogout} />;
}