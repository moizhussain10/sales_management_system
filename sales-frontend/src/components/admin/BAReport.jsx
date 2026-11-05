import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function BAReport({ salesData = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue_desc");
  const [selectedBA, setSelectedBA] = useState(null); // Selected BA for detail view

  const COMMISSION_PER_UNIT = 100; // PKR 100 per unit sold

  // Group sales by BA name/id dynamically from salesData
  const baMap = {};

  salesData.forEach((item) => {
    const key = item.ba_name ? item.ba_name.trim() : `BA-${item.ba_id}`;
    if (!baMap[key]) {
      baMap[key] = {
        ba_id: item.ba_id,
        ba_name: item.ba_name ? item.ba_name.trim() : "N/A",
        ba_username: item.ba_username || item.ba_name || "ba_user",
        location_name: item.location_name || "N/A",
        total_transactions: 0,
        total_units_sold: 0,
        total_revenue_generated: 0,
      };
    }
    const qty = parseInt(item.quantity || 0, 10);
    baMap[key].total_transactions += 1;
    baMap[key].total_units_sold += qty;
    baMap[key].total_revenue_generated += parseFloat(item.total_amount || 0);
  });

  // Convert object to array and calculate commission
  let baReports = Object.values(baMap).map(ba => ({
    ...ba,
    total_commission: ba.total_units_sold * COMMISSION_PER_UNIT
  }));

  // Sorting Logic
  if (sortBy === "revenue_desc") {
    baReports.sort(
      (a, b) => b.total_revenue_generated - a.total_revenue_generated,
    );
  } else if (sortBy === "revenue_asc") {
    baReports.sort(
      (a, b) => a.total_revenue_generated - b.total_revenue_generated,
    );
  } else if (sortBy === "commission_desc") {
    baReports.sort((a, b) => b.total_commission - a.total_commission);
  } else if (sortBy === "units_desc") {
    baReports.sort((a, b) => b.total_units_sold - a.total_units_sold);
  } else if (sortBy === "name_asc") {
    baReports.sort((a, b) => a.ba_name.localeCompare(b.ba_name));
  }

  // Filter Reports
  const filteredReports = baReports.filter(
    (ba) =>
      (ba.ba_name &&
        ba.ba_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ba.location_name &&
        ba.location_name.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  // Overall KPIs Calculation
  const totalFleetRevenue = baReports.reduce(
    (acc, curr) => acc + curr.total_revenue_generated,
    0,
  );
  const totalFleetUnits = baReports.reduce(
    (acc, curr) => acc + curr.total_units_sold,
    0,
  );
  const totalFleetCommission = totalFleetUnits * COMMISSION_PER_UNIT;

  // Chart Data (Top 8 BAs)
  const chartData = [...baReports]
    .sort((a, b) => b.total_revenue_generated - a.total_revenue_generated)
    .slice(0, 8)
    .map((ba) => ({
      name:
        ba.ba_name.length > 12
          ? ba.ba_name.substring(0, 12) + "..."
          : ba.ba_name,
      Revenue: ba.total_revenue_generated,
      Commission: ba.total_commission,
    }));

  // STRICT SINGLE BA SALES FILTERING HELPER
  const getSingleBASales = (ba) => {
    if (!ba) return [];
    return salesData.filter((s) => {
      if (ba.ba_id && s.ba_id && String(s.ba_id) === String(ba.ba_id)) {
        return true;
      }
      if (
        s.ba_name &&
        ba.ba_name &&
        s.ba_name.trim().toLowerCase() === ba.ba_name.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  };

  // Download individual BA report (CSV)
  const downloadSingleBAReport = (ba) => {
    const baSales = getSingleBASales(ba);

    if (baSales.length === 0) {
      alert(`"${ba.ba_name}" ki koi individual sales transaction recorded nahi hai.`);
      return;
    }

    const headers = [
      "Date & Time",
      "Product Name",
      "Store Location",
      "Quantity",
      "Commission (PKR)",
      "Total Amount (PKR)",
    ];

    const rows = baSales.map((item) => {
      const qty = parseInt(item.quantity || 0, 10);
      return [
        `"${item.created_at || item.sale_date || ""}"`,
        `"${item.product_name || ""}"`,
        `"${item.location_name || ba.location_name || ""}"`,
        qty,
        qty * COMMISSION_PER_UNIT,
        item.total_amount || 0,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        `"BA Performance & Commission Statement - ${ba.ba_name}"`,
        `"Assigned Location: ${ba.location_name}"`,
        `"Total Units Sold: ${ba.total_units_sold}"`,
        `"Commission Rate: PKR 100 per unit"`,
        `"Total Commission Earned: PKR ${ba.total_commission}"`,
        `"Total Revenue Generated: PKR ${ba.total_revenue_generated}"`,
        "",
        headers.join(","),
        ...rows.map((e) => e.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `BA_Commission_Report_${ba.ba_name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download All BAs Consolidated Summary (CSV)
  const downloadAllBAsSummary = () => {
    if (baReports.length === 0) {
      alert("Koi BA performance record nahi hai.");
      return;
    }

    const headers = [
      "Rank",
      "BA Name",
      "Store Location",
      "Total Transactions",
      "Total Units Sold",
      "Commission Earned (PKR)",
      "Total Revenue Generated (PKR)",
    ];
    const rows = baReports.map((ba, idx) => [
      idx + 1,
      `"${ba.ba_name}"`,
      `"${ba.location_name}"`,
      ba.total_transactions,
      ba.total_units_sold,
      ba.total_commission,
      ba.total_revenue_generated,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Fleet Performance & Commission Executive Summary",
        `Generated On: ${new Date().toLocaleString()}`,
        `Total Active Fleet: ${baReports.length}`,
        `Total Fleet Units Sold: ${totalFleetUnits}`,
        `Total Fleet Commission Distributed: PKR ${totalFleetCommission}`,
        `Total Overall Revenue: PKR ${totalFleetRevenue}`,
        "",
        headers.join(","),
        ...rows.map((e) => e.join(",")),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Full_Fleet_Commission_Summary_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected BA Sales Filtering
  const selectedBASales = selectedBA ? getSingleBASales(selectedBA) : [];

  // Accurate Product Breakdown Calculation
  const baProductStats = {};
  selectedBASales.forEach((item) => {
    const prodName = item.product_name
      ? item.product_name.trim()
      : "Unknown Product";
    const qty = parseInt(item.quantity, 10) || 0;
    if (qty > 0) {
      baProductStats[prodName] = (baProductStats[prodName] || 0) + qty;
    }
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <div>
          <span className="bg-teal-500/20 text-teal-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
            Performance & Commission Analytics
          </span>
          <h2 className="text-3xl font-black mt-2 tracking-tight">
            Brand Ambassador Commission Reports
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Tracking live sales performance and <strong>PKR 100/unit</strong> commission payouts across the fleet.
          </p>
        </div>
        <button
          onClick={downloadAllBAsSummary}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap flex items-center justify-center space-x-2"
        >
          <span>📊 Export Fleet Summary (CSV)</span>
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Active Ambassadors
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {baReports.length} Representatives
          </h3>
          <p className="text-xs text-teal-700 font-bold mt-1 bg-teal-50 px-2.5 py-1 rounded-lg w-fit">
            📍 Active Fleet
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Total Units Sold
          </p>
          <h3 className="text-2xl font-black text-slate-900 mt-2">
            {totalFleetUnits.toLocaleString()} Units
          </h3>
          <p className="text-xs text-indigo-700 font-bold mt-1 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit">
            📦 Fleet Volume
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Total Commission Payable
          </p>
          <h3 className="text-2xl font-black text-amber-600 mt-2">
            PKR {totalFleetCommission.toLocaleString()}
          </h3>
          <p className="text-xs text-amber-700 font-bold mt-1 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
            💰 @ PKR 100 / Unit
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Total Revenue Generated
          </p>
          <h3 className="text-2xl font-black text-teal-700 mt-2">
            PKR {totalFleetRevenue.toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-700 font-bold mt-1 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
            💵 Total Gross Sales
          </p>
        </div>
      </div>

      {/* Visual Leaderboard Bar Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
          <span>🏆</span> Top Revenue Generating Brand Ambassadors (PKR)
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                angle={-15}
                textAnchor="end"
                interval={0}
                tick={{ fontSize: 10 }}
                stroke="#94a3b8"
              />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  borderRadius: "12px",
                  fontSize: "12px",
                  border: "none",
                }}
              />
              <Bar dataKey="Revenue" fill="#0d9488" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BA Table Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-lg">
              Ambassador Performance Directory
            </h3>
            <p className="text-xs text-slate-400">
              Click on any row to open the detailed profile page and commission ledger of that BA.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-bold text-slate-700 focus:outline-none focus:border-teal-600 shadow-sm"
            >
              <option value="revenue_desc">▼ Sort: Highest Revenue</option>
              <option value="commission_desc">💰 Sort: Highest Commission</option>
              <option value="revenue_asc">▲ Sort: Lowest Revenue</option>
              <option value="units_desc">📦 Sort: Most Units Sold</option>
              <option value="name_asc">🔤 Sort: Name (A to Z)</option>
            </select>

            <input
              type="text"
              placeholder="🔍 Search BA name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 w-full sm:w-64 focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm font-bold"
            />
          </div>
        </div>

        {/* BA Performance Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3">Rank & Ambassador Name</th>
                <th className="py-3.5 px-3">Assigned Location</th>
                <th className="py-3.5 px-3 text-center">Transactions</th>
                <th className="py-3.5 px-3 text-center">Units Sold</th>
                <th className="py-3.5 px-3 text-right">Commission (@100/unit)</th>
                <th className="py-3.5 px-3 text-right">Total Revenue</th>
                <th className="py-3.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredReports.map((ba, idx) => (
                <tr
                  key={idx}
                  onClick={() => setSelectedBA(ba)}
                  className="hover:bg-slate-50/90 transition cursor-pointer group"
                >
                  <td className="py-4 px-3 font-bold text-slate-800">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-2xl text-[11px] font-black flex items-center justify-center border shadow-sm ${
                          idx === 0
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : idx === 1
                              ? "bg-slate-200 text-slate-800 border-slate-300"
                              : idx === 2
                                ? "bg-orange-100 text-orange-800 border-orange-300"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {idx === 0
                          ? "🥇"
                          : idx === 1
                            ? "🥈"
                            : idx === 2
                              ? "🥉"
                              : `#${idx + 1}`}
                      </span>
                      <div>
                        <p className="font-black text-slate-900 group-hover:text-teal-700 transition flex items-center gap-1.5">
                          {ba.ba_name}
                          <span className="text-[10px] bg-slate-100 text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-700 px-2 py-0.5 rounded-md font-bold">
                            View Profile ↗
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium">
                          @{ba.ba_username}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-slate-700 font-bold">
                    📍 {ba.location_name}
                  </td>
                  <td className="py-4 px-3 text-center font-extrabold text-slate-700">
                    <span className="bg-slate-100 px-3 py-1 rounded-xl">
                      {ba.total_transactions}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center font-black text-slate-900">
                    {ba.total_units_sold} Units
                  </td>
                  <td className="py-4 px-3 text-right font-black text-amber-600 text-sm">
                    PKR {ba.total_commission.toLocaleString()}
                  </td>
                  <td className="py-4 px-3 text-right font-black text-teal-700 text-base">
                    PKR {ba.total_revenue_generated.toLocaleString()}
                  </td>
                  <td
                    className="py-4 px-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => downloadSingleBAReport(ba)}
                      className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-black text-xs px-4 py-2.5 rounded-2xl transition border border-teal-200 shadow-sm"
                    >
                      📄 Statement
                    </button>
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-12 text-xs font-bold text-slate-400"
                  >
                    No BA performance records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED BA PROFILE PAGE / MODAL */}
      {selectedBA && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-teal-700 to-teal-900 text-white font-black text-xl flex items-center justify-center shadow-lg">
                  {selectedBA.ba_name
                    ? selectedBA.ba_name[0].toUpperCase()
                    : "B"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-900">
                      {selectedBA.ba_name}
                    </h3>
                    <span className="bg-teal-50 text-teal-700 text-xs font-extrabold px-3 py-1 rounded-full border border-teal-100">
                      📍 {selectedBA.location_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    @{selectedBA.ba_username} &nbsp;·&nbsp; Detailed Individual
                    Performance & Commission Audit Statement
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBA(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl w-10 h-10 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Individual KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Total Units Sold
                </p>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  {selectedBA.total_units_sold} Units
                </h4>
              </div>

              <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200/80">
                <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                  Commission Earned (@100/unit)
                </p>
                <h4 className="text-xl font-black text-amber-700 mt-1">
                  PKR {selectedBA.total_commission.toLocaleString()}
                </h4>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Total Revenue
                </p>
                <h4 className="text-xl font-black text-teal-700 mt-1">
                  PKR {selectedBA.total_revenue_generated.toLocaleString()}
                </h4>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Total Orders
                </p>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  {selectedBA.total_transactions} Orders
                </h4>
              </div>
            </div>

            {/* Product-wise Sales Breakdown */}
            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="font-black text-slate-900 text-sm">
                📦 Products Sold Breakdown by {selectedBA.ba_name}
              </h4>

              {Object.keys(baProductStats).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(baProductStats).map(
                    ([prodName, totalQty], idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs"
                      >
                        <span className="font-bold text-slate-800">
                          {prodName}
                        </span>
                        <div className="text-right">
                          <span className="font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg border border-teal-100 block">
                            {totalQty} Units
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 mt-0.5 block">
                            Com: PKR {totalQty * COMMISSION_PER_UNIT}
                          </span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium">
                  Is Brand Ambassador ki koi individual product sales record nahi hain.
                </p>
              )}
            </div>

            {/* Individual Live Transactions Log */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-slate-900 text-sm">
                  📜 Live Sales & Commission Audit History
                </h4>
                <button
                  onClick={() => downloadSingleBAReport(selectedBA)}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md transition"
                >
                  📥 Export {selectedBA.ba_name}'s Statement (CSV)
                </button>
              </div>

              <div className="overflow-x-auto max-h-60 border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-100">
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Commission (PKR)</th>
                      <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {selectedBASales.map((sale, idx) => {
                      const qty = parseInt(sale.quantity || 0, 10);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-semibold text-slate-500">
                            {sale.created_at || sale.sale_date || "N/A"}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {sale.product_name}
                          </td>
                          <td className="py-3 px-3 text-center font-black text-slate-800">
                            {qty}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-amber-600">
                            PKR {qty * COMMISSION_PER_UNIT}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-teal-700">
                            PKR {Number(sale.total_amount).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {selectedBASales.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="text-center py-6 text-xs text-slate-400"
                        >
                          No recorded sales transactions for this BA.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedBA(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-md transition"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}