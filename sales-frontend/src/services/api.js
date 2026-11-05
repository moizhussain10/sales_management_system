import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV
    ? 'http://localhost/sales-management-system/sales_backend/'
    : '/sales_backend/');

axios.defaults.withCredentials = true;
let csrfToken = null;

axios.interceptors.request.use((config) => {
    if (csrfToken && !['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
        config.headers.set('X-CSRF-Token', csrfToken);
    }
    return config;
});

export const getCurrentUser = async () => {
    const response = await axios.get(`${API_URL}me.php`);
    csrfToken = response.data.csrf_token || null;
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}login.php`, credentials);
    csrfToken = response.data.user?.csrf_token || null;
    return response.data;
};

export const logoutUser = async () => {
    try {
        const response = await axios.post(`${API_URL}logout.php`);
        return response.data;
    } finally {
        csrfToken = null;
    }
};

export const submitSale = async (saleData) => {
    const response = await axios.post(`${API_URL}submit_sale.php`, saleData);
    return response.data;
};