import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, submitSale } from "../services/api";

export default function BASalesEntry({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [deals, setDeals] = useState([]);

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [locationId, setLocationId] = useState(user.location_id || "1");
  const [selectedDealId, setSelectedDealId] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("absent");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}get_products.php`)
      .then((res) => {
        if (res.data.status === "success") {
          setProducts(res.data.products);
          setLocations(res.data.locations);
        }
      })
      .catch((err) => console.error(err));

    axios
      .get(`${API_URL}manage_deals.php`)
      .then((res) => {
        if (res.data.status === "success") {
          setDeals(res.data.deals);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  // Deal select hone par product auto-select
  const handleDealChange = (dealId) => {
    setSelectedDealId(dealId);
    if (dealId) {
      const deal = deals.find((d) => d.id == dealId);
      if (deal && deal.product_id) {
        setProductId(deal.product_id);
      }
    }
  };

  const handleProductChange = (nextProductId) => {
    setProductId(nextProductId);
    const selectedDeal = deals.find((deal) => deal.id == selectedDealId);
    if (
      selectedDeal?.product_id &&
      String(selectedDeal.product_id) !== String(nextProductId)
    ) {
      setSelectedDealId("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const chosenDeal = deals.find((d) => d.id == selectedDealId);

    try {
      const payload = {
        product_id: productId,
        ba_id: user.id,
        location_id: locationId,
        quantity: parseInt(quantity),
        deal_id: chosenDeal ? Number(chosenDeal.id) : null,
      };

      console.log("Submitting Payload:", payload); // Console mein check karne ke liye

      const res = await submitSale(payload);

      if (res.status === "success") {
        setMessage("✅ Sales aur deal successfully submit ho gayi!");
        setQuantity("1");
        setProductId("");
        setSelectedDealId("");
      } else {
        setMessage(`❌ ${res.message}`);
      }
    } catch (err) {
      setMessage("❌ Network error aa gaya.");
    }
  };

  const handleSelfAttendanceUpdate = async () => {
    try {
      const res = await axios.post(`${API_URL}manage_attendance.php`, {
        ba_id: Number(user.id),
        date: new Date().toISOString().slice(0, 10),
        status: attendanceStatus,
        note: attendanceStatus === 'day_off' ? 'Marked by BA self-service' : 'Checked in by BA',
        actor_role: 'ba',
        actor_id: Number(user.id),
        marked_by: Number(user.id),
      });

      if (res.data.status === 'success') {
        setAttendanceMessage(`✅ Attendance updated: ${attendanceStatus.replace('_', ' ')}`);
      } else {
        setAttendanceMessage(`❌ ${res.data.message || 'Failed to update attendance'}`);
      }
    } catch (err) {
      console.error(err);
      setAttendanceMessage('❌ Network error while updating attendance');
    }
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "BA";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs">
        <span className="font-bold text-lg tracking-tight text-slate-900">
          👤 Ambassador Portal
        </span>
        <div className="flex items-center space-x-4">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-300">
            {initials}
          </div>
          <button
            onClick={onLogout}
            className="text-xs bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center flex-1 p-4">
        <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-xl border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">
            Hello, {user.name}! Record your store sales below.
          </p>
          <h2 className="text-2xl font-bold mb-6 text-slate-900">
            Daily Sales Entry
          </h2>

          {message && (
            <div
              className={`mb-4 p-3 rounded-xl text-xs font-semibold ${message.includes("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}
            >
              {message}
            </div>
          )}

          {attendanceMessage && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${attendanceMessage.includes("✅") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
              {attendanceMessage}
            </div>
          )}

          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">My Attendance</p>
                <p className="text-[11px] text-slate-500">Mark yourself present, absent, or day off.</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="day_off">Day Off</option>
              </select>
              <button
                type="button"
                onClick={handleSelfAttendanceUpdate}
                className="bg-slate-900 hover:bg-slate-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            {/* Apply Promotion / Deal */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Apply Promotion / Deal (Optional)
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => handleDealChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
              >
                <option value="">-- No Deal (Normal Sale) --</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    🔥 {d.deal_title} ({d.discount_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Dropdown */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Product <span className="text-rose-500">*</span>
              </label>
              <select
                value={productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
                required
              >
                <option value="">Choose a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (PKR {p.price})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Paid Quantity Sold <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none font-medium"
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Store Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
                required
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold p-3.5 rounded-xl transition-all shadow-md mt-2"
            >
              Submit Sale ✓
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        Sales Management System © 2026
      </div>
    </div>
  );
}
