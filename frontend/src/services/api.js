import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Only remove auth data, not everything in localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login — user can log in with existing credentials
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

// Dashboard
export const getDashboardStats = () => API.get('/dashboard');

// Vehicles
export const getVehicles = () => API.get('/vehicles');
export const addVehicle = (data) => API.post('/vehicles', data);
export const updateVehicle = (id, data) => API.put(`/vehicles/${id}`, data);
export const deleteVehicle = (id) => API.delete(`/vehicles/${id}`);

// Violations
export const getViolations = (status) =>
    API.get('/violations', { params: status ? { status } : {} });
export const getViolation = (id) => API.get(`/violations/${id}`);
export const createViolation = (formData) =>
    API.post('/violations', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
export const updateViolationStatus = (id, status) =>
    API.put(`/violations/${id}/status`, { status });
export const approveViolation = (id, fineAmount) =>
    API.put(`/violations/${id}/approve`, { fineAmount });

// Fines
export const getFines = () => API.get('/fines');

// Payments
export const makePayment = (data) => API.post('/payments', data);
export const getPayments = () => API.get('/payments');

export default API;
