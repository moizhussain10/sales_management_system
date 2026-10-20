import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  BarChart, Bar 
} from 'recharts';

export default function SalesAnalytics({ salesData = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [selectedBa, setSelectedBa] = useState('ALL');

  // Date & Month Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Unique lists options
  const locations = [...new Set(salesData.map(item => item.location_name).filter(Boolean))];
  const products = [...new Set(salesData.map(item => item.product_name).filter(Boolean))];
  const baNames = [...new Set(salesData.map(item => item.ba_name).filter(Boolean))];

  // Dynamic Unique Months Options (YYYY-MM)
  const availableMonths = [...new Set(salesData.map(item => {
    const rawDate = item.created_at || item.sale_date;
    return rawDate ? rawDate.substring(0, 7) : null;
  }).filter(Boolean))].sort().reverse();

  // Helper to format Month Labels (e.g., '2026-10' -> 'October 2026')
  const formatMonthLabel = (monthStr) => {
    if (!monthStr) return monthStr;
    const [year, month] = monthStr.split('-');
    const dateObj = new Date(year, month - 1);
    return dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  // Filter Sales Logic
  const filteredSales = salesData.filter(item => {
    const matchesSearch = 
      (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.ba_name && item.ba_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location_name && item.location_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLocation = selectedLocation === 'ALL' || item.location_name === selectedLocation;
    const matchesProduct = selectedProduct === 'ALL' || item.product_name === selectedProduct;
    const matchesBa = selectedBa === 'ALL' || item.ba_name === selectedBa;

    // Date & Month Checks
    const itemDateStr = item.created_at || item.sale_date || '';
    const itemDateOnly = itemDateStr ? itemDateStr.substring(0, 10) : '';
    const itemMonthStr = itemDateStr ? itemDateStr.substring(0, 7) : '';

    const matchesStartDate = !startDate || (itemDateOnly && itemDateOnly >= startDate);
    const matchesEndDate = !endDate || (itemDateOnly && itemDateOnly <= endDate);
    const matchesMonth = selectedMonth === 'ALL' || itemMonthStr === selectedMonth;

    return matchesSearch && matchesLocation && matchesProduct && matchesBa && matchesStartDate && matchesEndDate && matchesMonth;
  });

  // Calculate KPIs dynamically
  const productStats = {};
  const baStats = {};
  const locationStats = {};

  filteredSales.forEach(item => {
    const qty = parseInt(item.quantity) || 0;
    const amount = parseFloat(item.total_amount) || 0;
    
    productStats[item.product_name] = (productStats[item.product_name] || 0) + qty;
    baStats[item.ba_name] = (baStats[item.ba_name] || 0) + amount;
    locationStats[item.location_name] = (locationStats[item.location_name] || 0) + amount;
  });

  const topProduct = Object.keys(productStats).reduce((a, b) => productStats[a] > productStats[b] ? a : b, 'N/A');
  const topBA = Object.keys(baStats).reduce((a, b) => baStats[a] > baStats[b] ? a : b, 'N/A');
  const topLocation = Object.keys(locationStats).reduce((a, b) => locationStats[a] > locationStats[b] ? a : b, 'N/A');

  // Prepare Chart Data
  const chartData = Object.keys(locationStats).map(loc => ({
    location: loc,
    revenue: locationStats[loc]
  }));

  const productChartData = Object.keys(productStats).map(prod => ({
    product: prod.length > 15 ? prod.substring(0, 15) + '...' : prod,
    units: productStats[prod]
  }));

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedLocation('ALL');
    setSelectedProduct('ALL');
    setSelectedBa('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('ALL');
    setCurrentPage(1);
  };

  // Download CSV
  const downloadCSV = () => {
    if (filteredSales.length === 0) {
      alert("Download ke liye koi data nahi hai!");
      return;
    }
    const headers = ["Date & Time", "Product Name", "BA Name", "Location", "Quantity", "Total Amount (PKR)"];
    const rows = filteredSales.map(item => [
      `"${item.created_at || item.sale_date || ''}"`,
      `"${item.product_name || ''}"`,
      `"${item.ba_name || ''}"`,
      `"${item.location_name || ''}"`,
      item.quantity || 0,
      item.total_amount || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Sales_Analytics_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSalesPage = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const isAnyFilterActive = searchTerm || selectedLocation !== 'ALL' || selectedProduct !== 'ALL' || selectedBa !== 'ALL' || startDate || endDate || selectedMonth !== 'ALL';

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <div>
          <span className="bg-teal-500/20 text-teal-300 text-xs font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
            Executive Dashboard
          </span>
          <h2 className="text-3xl font-black mt-2 tracking-tight">Sales Analytics & Insights</h2>
          <p className="text-slate-300 text-xs mt-1">Real-time performance metrics, date-wise filtering, visual graphs, and complete transaction logs.</p>
        </div>
        <button 
          onClick={downloadCSV}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 whitespace-nowrap"
        >
          <span>📥 Export Filtered Sales CSV</span>
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 bg-teal-600 text-white text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl font-black">Best Seller</div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Top Product Sold</p>
          <h3 className="text-xl font-black text-slate-900 mt-2">{topProduct}</h3>
          <p className="text-xs text-teal-600 font-bold mt-1 bg-teal-50 px-2.5 py-1 rounded-lg w-fit">
            🔥 {productStats[topProduct] ? `${productStats[topProduct]} Units Sold` : 'No sales yet'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl font-black">Top Ambassador</div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Best Performing BA</p>
          <h3 className="text-xl font-black text-slate-900 mt-2">{topBA}</h3>
          <p className="text-xs text-indigo-600 font-bold mt-1 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit">
            ⭐ {baStats[topBA] ? `PKR ${baStats[topBA].toLocaleString()} Generated` : 'No sales yet'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl font-black">Top Store</div>
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Highest Sales Location</p>
          <h3 className="text-xl font-black text-slate-900 mt-2">{topLocation}</h3>
          <p className="text-xs text-amber-600 font-bold mt-1 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
            📍 {locationStats[topLocation] ? `PKR ${locationStats[topLocation].toLocaleString()} Revenue` : 'No sales yet'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <span>📈</span> Store Location Revenue Breakdown (PKR)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="location" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }} />
                <Area type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Sales Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <span>📊</span> Product Sales Leaderboard (Units Sold)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="product" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', fontSize: '12px', border: 'none' }} />
                <Bar dataKey="units" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transactions Sheet Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-black text-slate-900 text-lg">All Sales Transactions Sheet</h3>
              <p className="text-xs text-slate-400">Search and filter live records by dates, months, products, and locations.</p>
            </div>
            <div className="flex items-center gap-2">
              {isAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200 transition"
                >
                  Reset Filters ✕
                </button>
              )}
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-xl border border-slate-200">
                Showing {filteredSales.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredSales.length)} of {filteredSales.length} entries
              </span>
            </div>
          </div>
          
          {/* Advanced Multi-Filter Control Bar */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3">
            {/* Row 1: Search, Month Filter & Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Search Keywords</label>
                <input 
                  type="text" 
                  placeholder="🔍 Search product, BA, store..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="text-xs bg-white border border-slate-200 rounded-2xl px-4 py-2.5 w-full font-medium focus:outline-none focus:border-teal-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Select Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                  className="text-xs bg-white border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-slate-700 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  <option value="ALL">📅 All Months</option>
                  {availableMonths.map((m, idx) => (
                    <option key={idx} value={m}>{formatMonthLabel(m)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                  className="text-xs bg-white border border-slate-200 rounded-2xl px-4 py-2 w-full font-bold text-slate-700 focus:outline-none focus:border-teal-600 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                  className="text-xs bg-white border border-slate-200 rounded-2xl px-4 py-2 w-full font-bold text-slate-700 focus:outline-none focus:border-teal-600 shadow-sm"
                />
              </div>
            </div>

            {/* Row 2: Entity Filters (Location, Product, BA) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-200/60">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Store Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => { setSelectedLocation(e.target.value); setCurrentPage(1); }}
                  className="text-xs bg-white border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-slate-700 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  <option value="ALL">📍 All Locations</option>
                  {locations.map((loc, idx) => (<option key={idx} value={loc}>{loc}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Product</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}
                  className="text-xs bg-white border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-slate-700 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  <option value="ALL">📦 All Products</option>
                  {products.map((prod, idx) => (<option key={idx} value={prod}>{prod}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Brand Ambassador</label>
                <select
                  value={selectedBa}
                  onChange={(e) => { setSelectedBa(e.target.value); setCurrentPage(1); }}
                  className="text-xs bg-white border border-slate-200 rounded-2xl px-4 py-2.5 w-full text-slate-700 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  <option value="ALL">👤 All Brand Ambassadors</option>
                  {baNames.map((ba, idx) => (<option key={idx} value={ba}>{ba}</option>))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3">Date & Time</th>
                <th className="py-3.5 px-3">Product Name</th>
                <th className="py-3.5 px-3">Ambassador</th>
                <th className="py-3.5 px-3">Store Location</th>
                <th className="py-3.5 px-3 text-center">Qty</th>
                <th className="py-3.5 px-3 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentSalesPage.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-3 text-xs font-semibold text-slate-400">{item.created_at || item.sale_date}</td>
                  <td className="py-4 px-3 font-bold text-slate-900">{item.product_name}</td>
                  <td className="py-4 px-3 font-medium text-slate-700">👤 {item.ba_name}</td>
                  <td className="py-4 px-3 font-medium text-slate-600">📍 {item.location_name}</td>
                  <td className="py-4 px-3 text-center font-black text-slate-800">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{item.quantity}</span>
                  </td>
                  <td className="py-4 px-3 text-right font-black text-teal-700 text-base">PKR {Number(item.total_amount).toLocaleString()}</td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-xs font-bold text-slate-400">No matching sales records found for selected date/filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredSales.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-teal-600"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition"
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-black transition shadow-sm ${
                    currentPage === pageNum ? 'bg-teal-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}