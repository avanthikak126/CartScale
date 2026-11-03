import { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import * as api from '../api';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';
import LoadingSpinner from '../components/LoadingSpinner';
import './Cart.css';

export default function Cart({ token, showToast, updateCartCount, navigate }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await api.getCart();
    if (error) { showToast(error, 'error'); }
    else { setCart(data); }
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [token]);

  const handleUpdateQty = async (itemId, newQty) => {
    const { error } = await api.updateCartItem(itemId, newQty);
    if (error) { showToast(error, 'error'); return; }
    fetchCart();
    updateCartCount();
  };

  const handleRemove = async (itemId) => {
    const { error } = await api.removeCartItem(itemId);
    if (error) { showToast(error, 'error'); return; }
    showToast('Item removed', 'info');
    fetchCart();
    updateCartCount();
  };

  const handleProceedToCheckout = () => {
    navigate('checkout');
  };

  if (!token) {
    return (
      <div className="cart-page">
        <div className="container cart-empty">
          <ShoppingBag size={56} className="cart-empty-icon" />
          <h2>Please sign in</h2>
          <p>Login to view your cart and start shopping.</p>
          <button className="btn btn-primary" onClick={() => navigate('login')}>Sign In</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container"><LoadingSpinner text="Loading your cart..." /></div>
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container cart-empty">
          <ShoppingBag size={56} className="cart-empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <button className="btn btn-primary" onClick={() => navigate('home')}>
            Start Shopping <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title">Shopping Cart</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemove}
              />
            ))}
          </div>
          <div className="cart-sidebar">
            <CartSummary
              items={items}
              onCheckout={handleProceedToCheckout}
              checking={false}
              buttonLabel="Proceed to Checkout"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
