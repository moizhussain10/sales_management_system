import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { submitSale } from '../services/api';

const API_URL = 'http://localhost/sales-management-system/sales_backend/';

export default function BASalesEntry({ user, onLogout }) {
    const [products, setProducts] = useState([]);
    const [locations, setLocations] = useState([]);
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [locationId, setLocationId] = useState(user.location_id || '1');
    const [message, setMessage] = useState('');

    useEffect(() => {
        axios.get(`${API_URL}get_products.php`)
            .then(res => {
                if (res.data.status === 'success') {
                    setProducts(res.data.products);
                    setLocations(res.data.locations);
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await submitSale({
                product_id: productId,
                ba_id: user.id,
                location_id: locationId,
                quantity: parseInt(quantity)
            });
            if (res.status === 'success') {
                setMessage('Sales successfully submit ho gayi!');
                setQuantity('1');
                setProductId('');
            } else {
                setMessage(res.message);
            }
        } catch (err) {
            setMessage('Network error aa gaya.');
        }
    };

    // Get initials for avatar (e.g. Moiz Hussain -> MH)
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'BA';

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-xs">
                <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg tracking-tight text-slate-900">👤 Ambassador Portal</span>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-300">
                        {initials}
                    </div>
                    <button onClick={onLogout} className="text-xs bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-semibold transition">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Form Container */}
            <div className="flex items-center justify-center flex-1 p-4">
                <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-xl border border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Hello, {user.name}! Enter your sales for today.</p>
                    <h2 className="text-2xl font-bold mb-6 text-slate-900">Daily Sales Entry</h2>
                    
                    {message && (
                        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${message.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                        {/* Product Dropdown */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Product <span className="text-rose-500">*</span></label>
                            <select 
                                value={productId} 
                                onChange={(e) => setProductId(e.target.value)} 
                                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
                                required
                            >
                                <option value="">Choose a product...</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} (PKR {p.price})</option>
                                ))}
                            </select>
                        </div>

                        {/* Sold Quantity with controls */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Sold Quantity Sold <span className="text-rose-500">*</span></label>
                            <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white">
                                <input 
                                    type="number" 
                                    min="1"
                                    value={quantity} 
                                    onChange={(e) => setQuantity(e.target.value)} 
                                    className="w-full p-3 text-slate-800 focus:outline-none font-medium"
                                    required 
                                />
                                <div className="flex border-l border-slate-300 bg-slate-50">
                                    <button type="button" onClick={() => setQuantity(Math.max(1, parseInt(quantity || 1) - 1))} className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold">-</button>
                                    <button type="button" onClick={() => setQuantity(parseInt(quantity || 0) + 1)} className="px-3 py-2 hover:bg-slate-200 text-slate-600 font-bold border-l border-slate-300">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Store Location */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Store Location <span className="text-rose-500">*</span></label>
                            <select 
                                value={locationId} 
                                onChange={(e) => setLocationId(e.target.value)} 
                                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
                                required
                            >
                                {locations.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date field preview */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Date</label>
                            <input 
                                type="text" 
                                disabled 
                                value={`Today: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`} 
                                className="w-full bg-slate-100 border border-slate-300 rounded-xl p-3 text-slate-500 font-medium cursor-not-allowed" 
                            />
                        </div>

                        <button type="submit" className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold p-3.5 rounded-xl transition-all shadow-md mt-2">
                            Submit Daily Sales ✓
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-6">Fields marked <span className="text-rose-500">*</span> are required</p>
                </div>
            </div>

            <div className="text-center text-xs text-slate-400 py-4">Sales Management System © 2026</div>
        </div>
    );
}