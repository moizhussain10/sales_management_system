import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost/sales-management-system/sales_backend/';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');

  const fetchProducts = () => {
    axios.get(`${API_URL}manage_products.php`)
      .then(res => {
        if (res.data.status === 'success') {
          setProducts(res.data.products);
        }
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setSku(p.sku);
    setPrice(p.price);
    setMsg('');
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName('');
    setSku('');
    setPrice('');
    setMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price) {
      setMsg('❌ Product name and price are required!');
      return;
    }

    try {
      const payload = {
        action: editingId ? 'update' : 'add',
        id: editingId,
        name,
        sku,
        price: parseFloat(price)
      };

      const res = await axios.post(`${API_URL}manage_products.php`, payload);

      if (res.data.status === 'success') {
        setMsg(`✅ ${res.data.message}`);
        handleResetForm();
        fetchProducts();
        setTimeout(() => setMsg(''), 3000);
      } else {
        setMsg(`❌ ${res.data.message}`);
      }
    } catch (err) {
      setMsg('❌ Network error!');
    }
  };

  const handleDelete = async (id, prodName) => {
    if (!window.confirm(`Kya aap "${prodName}" product ko delete karna chahte hain?`)) return;

    try {
      const res = await axios.post(`${API_URL}manage_products.php`, {
        action: 'delete',
        id: id
      });

      if (res.data.status === 'success') {
        fetchProducts();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Network error while deleting.");
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <span className="bg-teal-500/20 text-teal-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
          Catalog Management
        </span>
        <h2 className="text-3xl font-black mt-2 tracking-tight">Products Catalog & Pricing</h2>
        <p className="text-slate-300 text-xs mt-1">Add new products, manage official SKU codes, and update pricing tiers in real-time.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Add/Edit Product Form */}
        <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm h-fit space-y-5">
          <div>
            <div className="flex justify-between items-center">
              <h3 className="font-black text-xl text-slate-900">
                {editingId ? 'Edit Product Details' : 'Add New Product'}
              </h3>
              {editingId && (
                <button onClick={handleResetForm} className="text-xs text-rose-600 font-extrabold bg-rose-50 hover:bg-rose-100 px-3 py-1 rounded-xl transition">
                  Cancel Edit
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Manage official product lineup and unit pricing.</p>
          </div>

          {msg && (
            <div className={`p-3.5 rounded-2xl text-xs font-extrabold ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold text-slate-600">
            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Product Title</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition" 
                placeholder="e.g. Vitamin C Serum" 
              />
            </div>

            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">SKU Code (Optional)</label>
              <input 
                type="text" 
                value={sku} 
                onChange={(e) => setSku(e.target.value)} 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition" 
                placeholder="e.g. BE-VITC-SRM" 
              />
            </div>

            <div>
              <label className="block uppercase text-[10px] tracking-wider mb-1.5 text-slate-400 font-black">Retail Price (PKR)</label>
              <input 
                type="number" 
                value={price} 
                onChange={(e) => setPrice(e.target.value)} 
                required 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition" 
                placeholder="e.g. 1499" 
              />
            </div>

            <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white py-4 rounded-2xl font-black text-xs transition shadow-lg mt-2">
              {editingId ? '✓ Save Changes' : '+ Create Product'}
            </button>
          </form>
        </div>

        {/* Existing Products List */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-black text-xl text-slate-900">Active Products</h3>
              <p className="text-xs text-slate-400 mt-0.5">Total Products Catalog: {products.length}</p>
            </div>
            <input 
              type="text" 
              placeholder="🔍 Search product, SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 w-full sm:w-56 focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm font-bold"
            />
          </div>

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-2">
            {filteredProducts.map((p) => (
              <div key={p.id} className="py-4 flex items-center justify-between hover:bg-slate-50/80 transition px-3 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center font-black text-teal-700 text-base shadow-sm">
                    💄
                  </div>
                  <div>
                    <p className="font-black text-slate-900 text-sm">{p.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      SKU: <span className="text-slate-600 font-bold">{p.sku || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-teal-800 text-sm bg-teal-50 px-3.5 py-1.5 rounded-2xl border border-teal-100 shadow-sm">
                    PKR {parseFloat(p.price).toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(p)} 
                      className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 px-3.5 py-2 rounded-2xl font-black transition border border-amber-200/80 shadow-sm"
                    >
                      Edit Price
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id, p.name)} 
                      className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-2xl font-black transition border border-rose-200/80 shadow-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-center py-12 text-xs font-bold text-slate-400">No matching products found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}