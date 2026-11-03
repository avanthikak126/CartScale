import { useState, useEffect } from 'react';
import {
  MapPin, Plus, Package, CreditCard, Truck,
  CheckCircle, ArrowRight, ArrowLeft, Banknote,
} from 'lucide-react';
import * as api from '../api';
import AddressCard from '../components/AddressCard';
import AddressForm from '../components/AddressForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProductMeta } from '../data/productMeta';
import './Checkout.css';

export default function Checkout({ token, showToast, updateCartCount, navigate }) {
  const [cart, setCart] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    const [cartRes, addrRes] = await Promise.all([api.getCart(), api.getAddresses()]);
    if (cartRes.data) setCart(cartRes.data);
    if (addrRes.data) {
      setAddresses(addrRes.data);
      if (addrRes.data.length > 0 && !selectedAddressId) {
        setSelectedAddressId(addrRes.data[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  // Address handlers
  const handleAddAddress = async (formData) => {
    setSavingAddress(true);
    const { data, error } = await api.createAddress(formData);
    setSavingAddress(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Address saved!', 'success');
    setShowForm(false);
    setAddresses((prev) => [data, ...prev]);
    setSelectedAddressId(data.id);
  };

  const handleEditAddress = async (formData) => {
    setSavingAddress(true);
    const { data, error } = await api.updateAddress(editingAddress.id, formData);
    setSavingAddress(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Address updated!', 'success');
    setEditingAddress(null);
    setAddresses((prev) => prev.map((a) => (a.id === data.id ? data : a)));
  };

  const handleDeleteAddress = async (id) => {
    setDeletingId(id);
    const { error } = await api.deleteAddress(id);
    setDeletingId(null);
    if (error) { showToast(error, 'error'); return; }
    showToast('Address deleted', 'info');
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (selectedAddressId === id) {
      const remaining = addresses.filter((a) => a.id !== id);
      setSelectedAddressId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Razorpay payment flow
  const handleRazorpayPayment = async () => {
    setPlacing(true);

    // Step 1: Create Razorpay order on the backend (amount calculated server-side)
    const { data: order, error: orderError } = await api.createPaymentOrder();

    if (orderError) {
      setPlacing(false);
      showToast(orderError, 'error');
      return;
    }

    // Step 2: Open Razorpay Checkout popup
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!razorpayKeyId || razorpayKeyId === 'your_razorpay_test_key_id_here') {
      setPlacing(false);
      showToast('Razorpay key is not configured. Set VITE_RAZORPAY_KEY_ID in .env', 'error');
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      name: 'CartScale',
      description: 'Order Payment',
      order_id: order.id,
      handler: async (response) => {
        // Step 3: Verify payment on the backend
        const { data: verifyData, error: verifyError } = await api.verifyPayment({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });

        setPlacing(false);

        if (verifyError) {
          showToast('Payment verification failed. Contact support if money was deducted.', 'error');
          return;
        }

        if (verifyData?.verified) {
          // Step 4: Place the order in our system after verified payment
          const { data: orderData, error: placeError } = await api.createOrder(
            selectedAddressId,
            'razorpay'
          );

          if (placeError) {
            showToast('Payment succeeded but order creation failed. Contact support.', 'error');
            return;
          }

          const orderId = orderData?.order_id || orderData?.id || orderData;
          setOrderSuccess(orderId);
          showToast('Payment successful! Order placed.', 'success');
          updateCartCount();
        } else {
          showToast('Payment could not be verified. Please try again.', 'error');
        }
      },
      modal: {
        ondismiss: () => {
          setPlacing(false);
          showToast('Payment was cancelled.', 'info');
        },
      },
      theme: {
        color: '#6366f1',
      },
    };

    if (typeof window.Razorpay === 'undefined') {
      setPlacing(false);
      showToast('Razorpay SDK failed to load. Check your internet connection.', 'error');
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (response) => {
      setPlacing(false);
      showToast(
        response.error?.description || 'Payment failed. Please try again.',
        'error'
      );
    });
    rzp.open();
  };

  // COD order flow (existing)
  const handleCodOrder = async () => {
    setPlacing(true);
    const { data, error } = await api.createOrder(selectedAddressId, 'cod');
    setPlacing(false);
    if (error) { showToast(error, 'error'); return; }
    const orderId = data?.order_id || data?.id || data;
    setOrderSuccess(orderId);
    showToast('Order placed successfully!', 'success');
    updateCartCount();
  };

  // Checkout handler — routes to the right payment flow
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) { showToast('Please select a delivery address', 'warning'); return; }

    if (paymentMethod === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      await handleCodOrder();
    }
  };

  if (!token) {
    return (
      <div className="checkout-page">
        <div className="container checkout-empty">
          <Package size={56} className="checkout-empty-icon" />
          <h2>Please sign in</h2>
          <p>Login to proceed with checkout.</p>
          <button className="btn btn-primary" onClick={() => navigate('login')}>Sign In</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <div className="container"><LoadingSpinner text="Preparing checkout..." /></div>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="container checkout-success">
          <CheckCircle size={64} className="checkout-success-icon" />
          <h2>Order Placed Successfully!</h2>
          <p className="checkout-success-id">Order #{orderSuccess}</p>
          <p>Your order has been confirmed and will be delivered to your selected address.</p>
          <div className="checkout-success-actions">
            <button className="btn btn-primary" onClick={() => navigate('orders')}>
              View Orders <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('home')}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const items = cart?.items || [];
  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container checkout-empty">
          <Package size={56} className="checkout-empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Add items to your cart before proceeding to checkout.</p>
          <button className="btn btn-primary" onClick={() => navigate('home')}>
            Start Shopping <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="checkout-page">
      <div className="container">
        <button className="checkout-back" onClick={() => navigate('cart')}>
          <ArrowLeft size={18} /> Back to Cart
        </button>
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-layout">
          {/* Left: Steps */}
          <div className="checkout-steps">
            {/* Step 1: Delivery Address */}
            <section className="checkout-section">
              <div className="checkout-section-header">
                <div className="checkout-step-badge">1</div>
                <h2><MapPin size={20} /> Delivery Address</h2>
              </div>

              {addresses.length > 0 ? (
                <div className="checkout-addresses">
                  {addresses.map((addr) => (
                    <AddressCard
                      key={addr.id}
                      address={addr}
                      isSelected={selectedAddressId === addr.id}
                      onSelect={(a) => setSelectedAddressId(a.id)}
                      onEdit={(a) => setEditingAddress(a)}
                      onDelete={handleDeleteAddress}
                      deleting={deletingId === addr.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="checkout-no-address">
                  <MapPin size={36} className="checkout-no-address-icon" />
                  <p>No saved addresses. Add one to continue.</p>
                </div>
              )}

              <button className="btn btn-secondary checkout-add-addr" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Add New Address
              </button>
            </section>

            {/* Step 2: Order Summary */}
            <section className="checkout-section">
              <div className="checkout-section-header">
                <div className="checkout-step-badge">2</div>
                <h2><Package size={20} /> Order Summary</h2>
              </div>

              <div className="checkout-items">
                {items.map((item) => {
                  const meta = getProductMeta(item.products);
                  return (
                    <div key={item.id} className="checkout-item">
                      <img
                        src={meta.image}
                        alt={item.products.name}
                        className="checkout-item-img"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'; }}
                      />
                      <div className="checkout-item-info">
                        <span className="checkout-item-name">{item.products.name}</span>
                        <span className="checkout-item-qty">Qty: {item.quantity}</span>
                      </div>
                      <span className="checkout-item-price">
                        ₹{(item.products.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Step 3: Payment */}
            <section className="checkout-section">
              <div className="checkout-section-header">
                <div className="checkout-step-badge">3</div>
                <h2><CreditCard size={20} /> Payment Method</h2>
              </div>

              <div className="checkout-payment-options">
                <label className={`checkout-payment-option ${paymentMethod === 'razorpay' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => setPaymentMethod('razorpay')}
                  />
                  <div className="checkout-payment-radio" />
                  <CreditCard size={20} />
                  <div>
                    <span className="checkout-payment-label">Pay Online (Razorpay)</span>
                    <span className="checkout-payment-desc">Cards, UPI, Net Banking & Wallets</span>
                  </div>
                </label>

                <label className={`checkout-payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <div className="checkout-payment-radio" />
                  <Banknote size={20} />
                  <div>
                    <span className="checkout-payment-label">Cash on Delivery</span>
                    <span className="checkout-payment-desc">Pay when your order arrives</span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Right: Summary Sidebar */}
          <div className="checkout-sidebar">
            <div className="checkout-summary-card">
              <h3 className="checkout-summary-title">Order Total</h3>

              <div className="checkout-summary-rows">
                <div className="checkout-summary-row">
                  <span>Items ({itemCount})</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="checkout-summary-row">
                  <span>Delivery</span>
                  <span className="checkout-summary-free">FREE</span>
                </div>
              </div>

              <div className="checkout-summary-divider" />

              <div className="checkout-summary-row checkout-summary-total">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              {selectedAddress && (
                <div className="checkout-summary-address">
                  <h4><Truck size={14} /> Delivering to</h4>
                  <p>{selectedAddress.full_name}</p>
                  <p>{selectedAddress.address_line}</p>
                  <p>{selectedAddress.city}, {selectedAddress.state} — {selectedAddress.pincode}</p>
                </div>
              )}

              <button
                className="btn btn-primary btn-lg checkout-place-btn"
                onClick={handlePlaceOrder}
                disabled={placing || !selectedAddressId}
              >
                {placing
                  ? 'Processing...'
                  : paymentMethod === 'razorpay'
                    ? 'Pay with Razorpay'
                    : 'Place Order'}
              </button>

              <p className="checkout-demo-notice">
                {paymentMethod === 'razorpay'
                  ? '🔒 Razorpay Test Mode — use test card 4111 1111 1111 1111'
                  : '⚡ Demo checkout — no real payment is processed'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {(showForm || editingAddress) && (
        <AddressForm
          address={editingAddress}
          onSubmit={editingAddress ? handleEditAddress : handleAddAddress}
          onCancel={() => { setShowForm(false); setEditingAddress(null); }}
          loading={savingAddress}
        />
      )}
    </div>
  );
}
