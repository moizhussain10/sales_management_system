import React from 'react';

export default function Overview({ data }) {
  const stats = data.stats || {};
  const sales = data.sales || [];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Real-time overview of active brand ambassadors, today's sales, and stock allocations.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs font-semibold text-teal-300">
          ● Live Operations
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Today</span>
            <span className="p-2.5 bg-teal-50 text-teal-600 rounded-xl text-lg">💰</span>
          </div>
          <p className="text-3xl font-black text-slate-900">PKR {(stats.sales_today || 0).toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <span>↑</span> Updated in real-time
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Products Sold Today</span>
            <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-lg">📦</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.units_today || 0} <span className="text-sm font-semibold text-slate-500">Units</span></p>
          <p className="text-xs text-indigo-600 font-semibold mt-2">Across all locations</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Brand Ambassadors</span>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl text-lg">👤</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.active_bas || 0} <span className="text-sm font-semibold text-slate-500">Active</span></p>
          <p className="text-xs text-amber-600 font-semibold mt-2">Logged in & assigned</p>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900">Recent Sales Activity</h3>
            <p className="text-xs text-slate-500">Latest entries submitted by Brand Ambassadors</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">Live Logs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">BA Representative</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-center">Quantity</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sales.slice(0, 6).map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-3 font-semibold text-slate-800">{item.product_name}</td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        {item.ba_name ? item.ba_name[0] : 'B'}
                      </div>
                      <span className="text-slate-700 font-medium">{item.ba_name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{item.location_name}</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                  <td className="py-3.5 px-3 text-right font-black text-teal-600">PKR {Number(item.total_amount).toLocaleString()}</td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-xs text-slate-400">No recent transactions recorded today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}