import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../services/api';

export default function ProductStock() {
  const [stockData, setStockData] = useState([]);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('ALL');
  const [selectedProductFilter, setSelectedProductFilter] = useState('ALL');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [addQty, setAddQty] = useState('');
  const [msg, setMsg] = useState('');

  // Fetch stock and dropdown data directly inside component
  const fetchInventoryData = async () => {
    try {
      const prodRes = await axios.get(`${API_URL}get_products.php`);
      if (prodRes.data.status === 'success') {
        setProducts(prodRes.data.products || []);
        setLocations(prodRes.data.locations || []);
      }

      const stockRes = await axios.get(`${API_URL}get_stock.php`);
      if (stockRes.data.status === 'success') {
        setStockData(stockRes.data.stock || []);
      }
    } catch (err) {
      console.error("Error fetching inventory:", err);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setSelectedProduct(item.product_id || (products[0] ? products[0].id : ''));
      setSelectedLocation(item.location_id || (locations[0] ? locations[0].id : ''));
      setAddQty(item.quantity);
    } else {
      setSelectedProduct(products[0] ? products[0].id : '');
      setSelectedLocation(locations[0] ? locations[0].id : '');
      setAddQty('');
    }
    setMsg('');
    setShowModal(true);
  };

  const handleAddOrUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedLocation || addQty === '') {
      setMsg('❌ Please select product, location and enter quantity!');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}add_stock.php`, {
        product_id: parseInt(selectedProduct),
        location_id: parseInt(selectedLocation),
        quantity: parseInt(addQty)
      });

      if (res.data && res.data.status === 'success') {
        setMsg(`✅ ${res.data.message || 'Stock updated!'}`);
        setAddQty('');
        
        setTimeout(() => {
          setMsg('');
          setShowModal(false);
          fetchInventoryData(); // Refresh table data instantly from backend
        }, 600);
      } else {
        setMsg(`❌ ${res.data?.message || 'Failed to update stock.'}`);
      }
    } catch (err) {
      setMsg('❌ Server connection error!');
    }
  };

  const handleDeleteStock = async (id) => {
    if (!window.confirm("Kya aap waqai is stock record ko delete karna chahte hain?")) return;
    try {
      const res = await axios.post(`${API_URL}delete_stock.php`, { id });
      if (res.data.status === 'success') {
        fetchInventoryData();
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      alert("Network error while deleting.");
    }
  };

  const filteredStock = stockData.filter(item => {
    const matchesSearch = 
      (item.product_name && item.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.location_name && item.location_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLocation = 
      selectedLocationFilter === 'ALL' || 
      String(item.location_id) === String(selectedLocationFilter);

    const matchesProduct = 
      selectedProductFilter === 'ALL' || 
      String(item.product_id) === String(selectedProductFilter);

    return matchesSearch && matchesLocation && matchesProduct;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStock.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStockPage = filteredStock.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-8 rounded-3xl text-white shadow-xl border border-teal-900/30">
        <div>
          <span className="bg-teal-500/20 text-teal-300 text-[11px] font-black px-3.5 py-1 rounded-full border border-teal-500/30 uppercase tracking-widest">
            Inventory Management
          </span>
          <h2 className="text-3xl font-black mt-2 tracking-tight">Store Allocation & Stock Control</h2>
          <p className="text-slate-300 text-xs mt-1">Real-time inventory levels, store allocations, and instant stock updates.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap self-stretch sm:self-auto flex items-center justify-center space-x-2"
        >
          <span>+ Add / Update Stock</span>
        </button>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Search Keywords</label>
            <input 
              type="text" 
              placeholder="🔍 Search product, SKU..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 w-full font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Filter by Store</label>
            <select
              value={selectedLocationFilter}
              onChange={(e) => {
                setSelectedLocationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 w-full font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition"
            >
              <option value="ALL">📍 All Store Locations ({locations.length})</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>📍 {loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Filter by Product</label>
            <select
              value={selectedProductFilter}
              onChange={(e) => {
                setSelectedProductFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 w-full font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm transition"
            >
              <option value="ALL">📦 All Products ({products.length})</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>📦 {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {(searchTerm || selectedLocationFilter !== 'ALL' || selectedProductFilter !== 'ALL') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedLocationFilter('ALL');
              setSelectedProductFilter('ALL');
              setCurrentPage(1);
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-extrabold whitespace-nowrap px-4 py-2.5 bg-rose-50 hover:bg-rose-100 rounded-2xl border border-rose-200 transition self-end md:self-center"
          >
            Reset Filters ✕
          </button>
        )}
      </div>

      {/* Stock Table Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-black text-slate-900 text-lg">Stock Inventory Sheet</h3>
            <p className="text-xs text-slate-400">Live store stock quantities and low stock alerts.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-black px-3.5 py-1.5 rounded-2xl border border-slate-200">
            Showing {filteredStock.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredStock.length)} of {filteredStock.length} entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-3">Product Name</th>
                <th className="py-3.5 px-3">SKU</th>
                <th className="py-3.5 px-3">Store Location</th>
                <th className="py-3.5 px-3 text-right">Available Stock</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentStockPage.map((item, idx) => {
                const isLow = parseInt(item.quantity) < 10;
                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-3 font-black text-slate-900">{item.product_name}</td>
                    <td className="py-4 px-3">
                      <span className="font-mono text-xs bg-slate-100 px-3 py-1.5 rounded-xl text-slate-600 font-bold border border-slate-200">
                        {item.sku || `SKU-${item.id || idx}`}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-slate-700 font-bold">📍 {item.location_name}</td>
                    <td className="py-4 px-3 text-right font-black text-slate-900 text-base">{item.quantity} Units</td>
                    <td className="py-4 px-3 text-center">
                      <span className={`inline-block px-3.5 py-1.5 rounded-2xl text-[11px] font-black tracking-wide whitespace-nowrap border shadow-sm ${
                        isLow ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isLow ? '⚠️ Low Stock' : '✓ In Stock'}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-center space-x-2">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-black text-xs px-3.5 py-2 rounded-2xl transition border border-amber-200/80 shadow-sm"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteStock(item.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs px-3.5 py-2 rounded-2xl transition border border-rose-200/80 shadow-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-xs font-bold text-slate-400">
                    No matching inventory records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredStock.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-teal-600 shadow-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>entries per page</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-2xl text-xs font-black transition shadow-sm ${
                    currentPage === pageNum
                      ? 'bg-teal-700 text-white'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-2xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">Manage Inventory Stock</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select store & product to adjust stock quantity.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-black text-lg p-1">✕</button>
            </div>

            {msg && (
              <div className={`p-3.5 rounded-2xl text-xs font-extrabold ${msg.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {msg}
              </div>
            )}

            <form onSubmit={handleAddOrUpdateStock} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block uppercase text-[10px] tracking-wider text-slate-400 mb-1.5">Select Product</label>
                <select 
                  value={selectedProduct} 
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm"
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase text-[10px] tracking-wider text-slate-400 mb-1.5">Select Store Location</label>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm"
                  required
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase text-[10px] tracking-wider text-slate-400 mb-1.5">Quantity (Units)</label>
                <input 
                  type="number" 
                  value={addQty} 
                  onChange={(e) => setAddQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-teal-600 shadow-sm"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-black transition">Cancel</button>
                <button type="submit" className="w-1/2 bg-teal-700 hover:bg-teal-800 text-white py-3.5 rounded-2xl font-black shadow-lg transition">Save Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}