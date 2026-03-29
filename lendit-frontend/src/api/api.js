import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// JWT Interceptor — attaches token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);

// User APIs
export const getProfile = () => API.get('/users/profile');
export const getUserProfileById = (userId) => API.get(`/users/${userId}`);
export const updateMyProfile = (data) => API.patch('/users/profile', data);
export const updateMyLocation = (data) => API.patch('/users/location', data);

// Category APIs
export const getCategories = () => API.get('/categories');

// Tool APIs
export const getTools = (coords) => {
  if (coords && coords.latitude != null && coords.longitude != null) {
    return API.get(`/tools?lat=${coords.latitude}&lng=${coords.longitude}`);
  }
  return API.get('/tools');
};

export const getToolById = (id, coords) => {
  if (coords && coords.latitude != null && coords.longitude != null) {
    return API.get(`/tools/${id}?lat=${coords.latitude}&lng=${coords.longitude}`);
  }
  return API.get(`/tools/${id}`);
};

export const searchTools = (keyword, coords) => {
  const base = `/tools/search?keyword=${encodeURIComponent(keyword)}`;
  if (coords && coords.latitude != null && coords.longitude != null) {
    return API.get(`${base}&lat=${coords.latitude}&lng=${coords.longitude}`);
  }
  return API.get(base);
};

export const getToolsByCategory = (categoryId, coords) => {
  if (coords && coords.latitude != null && coords.longitude != null) {
    return API.get(`/tools/category/${categoryId}?lat=${coords.latitude}&lng=${coords.longitude}`);
  }
  return API.get(`/tools/category/${categoryId}`);
};
export const getMyTools = () => API.get('/tools/my-tools');
export const addTool = (formData) => API.post('/tools', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteTool = (id) => API.delete(`/tools/${id}`);
export const getBlockedDates = (toolId) => API.get(`/tools/${toolId}/blocked-dates`);

// Booking APIs
export const createBooking = (data) => API.post('/bookings', data);
export const getMyOrders = () => API.get('/bookings/my-orders');
export const getMyToolBookings = () => API.get('/bookings/my-tools');
export const updateBookingStatus = (id, status) => API.patch(`/bookings/${id}/status?status=${status}`);

// Review APIs
export const submitReview = (data) => API.post('/reviews', data);
export const getReviewsByBooking = (bookingId) => API.get(`/reviews/booking/${bookingId}`);
export const getReviewsByTool = (toolId) => API.get(`/reviews/tool/${toolId}`);

export default API;
