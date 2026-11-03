import { useState, useEffect } from 'react';
import { Package, ArrowRight } from 'lucide-react';
import * as api from '../api';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './Orders.css';

export default function Orders({ token, showToast, navigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productsMap, setProductsMap] = useState({});

  const fetchOrders = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    const [ordersRes, productsRes] = await Promise.all([
      api.getOrders(),
      api.getProducts(50),
    ]);

    if (ordersRes.error) {
      setError(ordersRes.error);
      if (showToast) showToast(ordersRes.error, 'error');
    } else {
      const data = ordersRes.data;
      setOrders(Array.isArray(data) ? data : data?.value || []);
    }

    if (productsRes.data) {
      const map = {};
      (Array.isArray(productsRes.data) ? productsRes.data : []).forEach(
        (p) => { map[p.id] = p.name; }
      );
      setProductsMap(map);
    }

    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, [token]);

  if (!token) {
    return (
      <div className="orders-page">
        <div className="container orders-empty">
          <Package size={56} className="orders-empty-icon" />
          <h2>Please sign in</h2>
          <p>Login to view your order history.</p>
          <button className="btn btn-primary" onClick={() => navigate('login')}>Sign In</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container"><LoadingSpinner text="Loading your orders..." /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="container orders-empty">
          <p className="orders-error">{error}</p>
          <button className="btn btn-secondary" onClick={fetchOrders}>Try Again</button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="container orders-empty">
          <Package size={56} className="orders-empty-icon" />
          <h2>No orders yet</h2>
          <p>Start shopping and place your first order!</p>
          <button className="btn btn-primary" onClick={() => navigate('home')}>
            Start Shopping <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="orders-title">Your Orders</h1>
        <div className="orders-list">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} productsMap={productsMap} />
          ))}
        </div>
      </div>
    </div>
  );
}
