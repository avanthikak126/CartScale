import { ShieldCheck, Truck } from 'lucide-react';
import './CartSummary.css';

export default function CartSummary({ items, onCheckout, checking, buttonLabel }) {
  const subtotal = items.reduce((sum, item) => sum + item.products.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="cart-summary">
      <h3 className="cart-summary-title">Order Summary</h3>

      <div className="cart-summary-rows">
        <div className="cart-summary-row">
          <span>Items ({itemCount})</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery</span>
          <span className="cart-summary-free">FREE</span>
        </div>
      </div>

      <div className="cart-summary-divider" />

      <div className="cart-summary-row cart-summary-total">
        <span>Total</span>
        <span>₹{subtotal.toLocaleString()}</span>
      </div>

      <button
        className="btn btn-primary btn-lg cart-summary-btn"
        onClick={onCheckout}
        disabled={checking || items.length === 0}
      >
        {checking ? 'Placing Order...' : (buttonLabel || 'Place Order')}
      </button>

      <div className="cart-summary-badges">
        <div className="cart-summary-badge">
          <Truck size={16} />
          <span>Free Delivery</span>
        </div>
        <div className="cart-summary-badge">
          <ShieldCheck size={16} />
          <span>Secure Checkout</span>
        </div>
      </div>

      <p className="cart-summary-demo">
        ⚡ Demo checkout — no real payment is processed
      </p>
    </div>
  );
}
