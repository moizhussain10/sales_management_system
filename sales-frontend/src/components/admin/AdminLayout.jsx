import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Overview from './Overview';
import ProductStock from './ProductStock';
import SalesAnalytics from './SalesAnalytics';
import BAManagement from './BAManagement';
import LocationManagement from './LocationManagement';
import ProductManagement from './ProductManagement';
import BAReport from './BAReport';
import DealManagement from './DealManagement';
import AttendanceManagement from './AttendanceManagement';
import AttendanceReport from './AttendanceReport';
import { API_URL } from '../../services/api';

export default function AdminLayout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({ stats: {}, stock: [], sales: [] });
  const [baList, setBaList] = useState([]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}admin_dashboard.php`);
      if (res.data.status === 'success') setDashboardData(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchBAs = async () => {
    try {
      const res = await axios.get(`${API_URL}manage_bas.php`);
      if (res.data.status === 'success') setBaList(res.data.users);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    fetchBAs();
  }, []);

  const handleCreateBA = async (newBaData) => {
    try {
      const res = await axios.post(`${API_URL}manage_bas.php`, newBaData);
      if (res.data.status === 'success') fetchBAs();
      return res.data;
    } catch (err) {
      return { status: 'error', message: 'Network error' };
    }
  };

  const handleDeleteBA = async (baId) => {
    if (!window.confirm("Kya aap waqai is BA account ko remove karna chahte hain?")) return;
    try {
      const res = await axios.post(`${API_URL}manage_bas.php`, {
        action: 'delete',
        ba_id: baId,
      });
      if (res.data.status === 'success') fetchBAs();
    } catch (err) { console.error(err); }
  };

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'stock', label: 'Inventory', icon: '📦' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'bas', label: 'BA Accounts', icon: '👥' },
    { id: 'locations', label: 'Locations', icon: '📍' },
    { id: 'products', label: 'Products', icon: '💄' },
    { id: 'attendance', label: 'Attendance', icon: '✅' },
    { id: 'attendance-report', label: 'Reports', icon: '📋' },
    { id: 'ba-report', label: 'Performance', icon: '🏆' },
    { id: 'deal-management', label: 'Deals', icon: '🎯' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased text-slate-800">
      {/* Dark Modern Sidebar */}
      <aside className="w-72 bg-slate-950 text-white p-6 flex flex-col justify-between shadow-2xl border-r border-slate-800">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-teal-500/30">
              B
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wide text-white">Bloom Effekt</h1>
              <p className="text-[10px] text-teal-400 font-bold tracking-widest uppercase">Admin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2 overflow-y-auto pr-1 flex-1 scrollbar-hide">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-xs transition-all duration-200 ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 translate-x-1' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile / Logout */}
        <div className="border-t border-slate-800/80 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs border border-slate-700">
                AD
              </div>
              <div>
                <p className="text-xs font-bold text-white">Administrator</p>
                <p className="text-[10px] text-slate-500">System Manager</p>
              </div>
            </div>
            <button 
              onClick={onLogout} 
              className="text-xs bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white p-2.5 rounded-xl font-bold transition border border-rose-500/20"
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && <Overview data={dashboardData} />}
          {activeTab === 'stock' && <ProductStock stockData={dashboardData.stock} onRefresh={fetchData} />}
          {activeTab === 'analytics' && <SalesAnalytics salesData={dashboardData.sales} />}
          {activeTab === 'bas' && <BAManagement baList={baList} onCreateBA={handleCreateBA} onDeleteBA={handleDeleteBA} />}
          {activeTab === 'locations' && <LocationManagement />}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'attendance' && <AttendanceManagement baList={baList} />}
          {activeTab === 'attendance-report' && <AttendanceReport baList={baList} />}
          {activeTab === 'ba-report' && <BAReport salesData={dashboardData.sales} />}
          {activeTab === 'deal-management' && <DealManagement salesData={dashboardData.sales} />}
        </div>
      </main>
    </div>
  );
}