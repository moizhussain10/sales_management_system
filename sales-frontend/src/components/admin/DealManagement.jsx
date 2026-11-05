import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function DealManagement() {
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [dealTitle, setDealTitle] = useState('');
  const [discountType, setDiscountType] = useState('Percentage'); // 'Percentage', 'Fixed', 'BOGO', 'Bundle'
  const [discountValue, setDiscountValue] = useState('');
  const [productId, setProductId] = useState(''); // Target Product for deal
  
  const [requiredQuantity, setRequiredQuantity] = useState('1'); 
  const [freeQuantity, setFreeQuantity] = useState('1');         
  const [freeProductId, setFreeProductId] = useState('');
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    try {
      const dealRes = await axios.get(`${API_URL}manage_deals.php`);
      if (dealRes.data.status === 'success') {
        setDeals(dealRes.data.deals);
      }

      const prodRes = await axios.get(`${API_URL}manage_products.php`);
      if (prodRes.data.status === 'success') {
        setProducts(prodRes.data.products);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}manage_deals.php`, {
        action: 'add',
        deal_title: dealTitle,
        discount_type: discountType,
        discount_value: discountType === 'Percentage' || discountType === 'Fixed' ? parseFloat(discountValue || 0) : 0,
        product_id: productId || null,
        required_quantity: discountType === 'BOGO' || discountType === 'Bundle' ? parseInt(requiredQuantity || 1) : 1,
        free_quantity: discountType === 'BOGO' || discountType === 'Bundle' ? parseInt(freeQuantity || 1) : 0,
        free_product_id: discountType === 'Bundle' ? freeProductId : (discountType === 'BOGO' ? productId : null)
      });

      if (res.data.status === 'success') {
        setMsg(`✅ ${res.data.message}`);
        setDealTitle('');
        setDiscountValue('');
        setProductId('');
        setRequiredQuantity('1');
        setFreeQuantity('1');
        setFreeProductId('');
        fetchData();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(`❌ ${res.data.message}`);
      }
    } catch (err) {
      setMsg('❌ Network error!');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya aap is deal ko delete karna chahte hain?")) return;
    try {
      const res = await axios.post(`${API_URL}manage_deals.php`, { action: 'delete', id });
      if (res.data.status === 'success') {
        fetchData();
      }
    } catch (err) {
      alert("Error deleting deal");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <span className="bg-teal-500/20 text-teal-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
          Promotions & Deals
        </span>
        <h2 className="text-3xl font-black mt-2 tracking-tight">Active Deals & Bundle Campaigns</h2>
        <p className="text-slate-300 text-xs mt-1">Create promotional discounts, BOGO offers, and product bundle deals for Brand Ambassadors.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Create Deal Form */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm h-fit space-y-5">
          <h3 className="font-black text-xl text-slate-900">Create New Deal / Bundle</h3>

          {msg && (
            <div className={`p-3.5 rounded-2xl text-xs font-extrabold ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-600">
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Deal / Bundle Title</label>
              <input 
                type="text" 
                value={dealTitle} 
                onChange={(e) => setDealTitle(e.target.value)} 
                required 
                placeholder="e.g. Vitamin C Serum BOGO" 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
              />
            </div>

            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Deal Type</label>
              <select 
                value={discountType} 
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
              >
                <option value="Percentage">Percentage Discount (%)</option>
                <option value="Fixed">Flat Fixed Amount Discount (PKR)</option>
                <option value="BOGO">Buy X, Get Y Free (Same Product)</option>
                <option value="Bundle">Product Bundle (Buy X, Get Different Free Gift)</option>
              </select>
            </div>

            {/* Target Product */}
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Target Product (Jis par deal lagni hai)</label>
              <select 
                value={productId} 
                onChange={(e) => setProductId(e.target.value)} 
                required
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>💄 {p.name} (PKR {p.price})</option>
                ))}
              </select>
            </div>

            {(discountType === 'Percentage' || discountType === 'Fixed') && (
              <div>
                <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">
                  {discountType === 'Percentage' ? 'Discount Percentage (%)' : 'Flat Amount (PKR)'}
                </label>
                <input 
                  type="number" 
                  step="any"
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(e.target.value)} 
                  required 
                  placeholder={discountType === 'Percentage' ? 'e.g. 25' : 'e.g. 500'} 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                />
              </div>
            )}

            {(discountType === 'BOGO' || discountType === 'Bundle') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Buy Qty (X)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={requiredQuantity} 
                    onChange={(e) => setRequiredQuantity(e.target.value)} 
                    required 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Free Qty (Y)</label>
                  <input 
                    type="number" 
                    min="1"
                    value={freeQuantity} 
                    onChange={(e) => setFreeQuantity(e.target.value)} 
                    required 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                  />
                </div>
              </div>
            )}

            {discountType === 'Bundle' && (
              <div>
                <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Select Free Gift Product</label>
                <select 
                  value={freeProductId} 
                  onChange={(e) => setFreeProductId(e.target.value)}
                  required
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
                >
                  <option value="">-- Choose Free Item --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>🎁 {p.name} (PKR {p.price})</option>
                  ))}
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded-2xl font-black text-xs transition shadow-lg mt-2">
              + Publish Deal / Bundle
            </button>
          </form>
        </div>

        {/* Existing Deals List */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <h3 className="font-black text-xl text-slate-900">Active Deals & Bundles</h3>
          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-2">
            {deals.map((d) => (
              <div key={d.id} className="py-4 flex items-center justify-between hover:bg-slate-50/80 transition px-3 rounded-2xl">
                <div>
                  <p className="font-black text-slate-900 text-sm">🔥 {d.deal_title}</p>
                  <p className="text-xs text-teal-700 font-bold mt-0.5">
                    Type: {d.discount_type} 
                    {d.discount_type === 'Percentage' && ` (${d.discount_value}%)`}
                    {d.discount_type === 'Fixed' && ` (PKR ${d.discount_value})`}
                    {(d.discount_type === 'BOGO' || d.discount_type === 'Bundle') && ` (Buy ${d.required_quantity}, Get ${d.free_quantity} Free)`}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(d.id)} 
                  className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-2xl font-black transition border border-rose-200"
                >
                  Delete 🗑️
                </button>
              </div>
            ))}
            {deals.length === 0 && (
              <p className="text-center py-12 text-xs font-bold text-slate-400">Koi active deal ya bundle mojood nahi hai.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}