const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const { method = 'GET', body, auth = false } = options;

  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(auth ? authHeaders() : {}),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();

    if (!response.ok) {
      // Auto-clear stale token on 401 and force re-login
      if (response.status === 401 && auth) {
        localStorage.removeItem('token');
        window.location.reload();
        return { data: null, error: 'Session expired. Please login again.', status: 401 };
      }
      return { data: null, error: data.error || 'Something went wrong', status: response.status };
    }

    return { data, error: null, status: response.status };
  } catch {
    return { data: null, error: 'Network error. Please check your connection.', status: 0 };
  }
}

// Auth
export const login = (email, password) =>
  request('/login', { method: 'POST', body: { email, password } });

export const signup = (fullName, email, password) =>
  request('/signup', { method: 'POST', body: { fullName, email, password } });

// Products
export const getProducts = (limit = 20, page = 1, { categoryId, search, sort } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const params = new URLSearchParams({ limit: String(safeLimit), page: String(page) });
  if (categoryId) params.append('category_id', String(categoryId));
  if (search) params.append('search', search);
  if (sort) params.append('sort', sort);
  return request(`/products?${params}`);
};

export const getProductById = (id) =>
  request(`/products/${id}`);

// Categories
export const getCategories = () =>
  request('/categories');

// Cart
export const getCart = () =>
  request('/cart', { auth: true });

export const addToCart = (productId, quantity = 1) =>
  request('/cart/items', { method: 'POST', body: { product_id: productId, quantity }, auth: true });

export const updateCartItem = (id, quantity) =>
  request(`/cart/items/${id}`, { method: 'PATCH', body: { quantity }, auth: true });

export const removeCartItem = (id) =>
  request(`/cart/items/${id}`, { method: 'DELETE', auth: true });

// Orders
export const createOrder = (addressId, paymentMethod = 'cod') =>
  request('/orders', {
    method: 'POST',
    body: { address_id: addressId, payment_method: paymentMethod },
    auth: true,
  });

export const getOrders = () =>
  request('/orders', { auth: true });

export const getOrderById = (id) =>
  request(`/orders/${id}`, { auth: true });

// Addresses
export const getAddresses = () =>
  request('/addresses', { auth: true });

export const createAddress = (data) =>
  request('/addresses', { method: 'POST', body: data, auth: true });

export const updateAddress = (id, data) =>
  request(`/addresses/${id}`, { method: 'PATCH', body: data, auth: true });

export const deleteAddress = (id) =>
  request(`/addresses/${id}`, { method: 'DELETE', auth: true });

// Payments
export const createPaymentOrder = () =>
  request('/payments/create-order', { method: 'POST', auth: true });

export const verifyPayment = (data) =>
  request('/payments/verify', { method: 'POST', body: data, auth: true });

// Wishlist
export const getWishlist = () =>
  request('/wishlist', { auth: true });

export const addToWishlist = (productId) =>
  request('/wishlist/items', { method: 'POST', body: { product_id: productId }, auth: true });

export const removeFromWishlist = (productId) =>
  request(`/wishlist/items/${productId}`, { method: 'DELETE', auth: true });

export const checkWishlistItem = (productId) =>
  request(`/wishlist/check/${productId}`, { auth: true });

// SmartBuy Product Search & Recommendation Optimizer
export const getSmartBuyRecommendations = (params) =>
  request('/smartbuy/recommend', { method: 'POST', body: params });


