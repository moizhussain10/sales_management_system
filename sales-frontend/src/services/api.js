import axios from 'axios';

const API_URL = 'http://localhost/sales-management-system/sales_backend/';

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}login.php`, credentials);
    return response.data;
};

export const submitSale = async (saleData) => {
    const response = await axios.post(`${API_URL}submit_sale.php`, saleData);
    return response.data;
};