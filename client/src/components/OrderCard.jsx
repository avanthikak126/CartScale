import { useState } from 'react';
import { ChevronDown, ChevronUp, Package, MapPin, CreditCard } from 'lucide-react';
import './OrderCard.css';

const statusStyles = {
  pending: 'badge-warning',
  processing: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-error',
  shipped: 'badge-info',
  delivered: 'badge-success',
};

const paymentLabels = {
  cod: 'Cash on Delivery',
  upi: 'UPI Payment',
};

export default function OrderCard({ order, productsMap }) {
  const [expanded, setExpanded] = useState(false);
  const statusClass = statusStyles[(order.status || '').toLowerCase()] || 'badge-warning';
  const date = new Date(order.created_at).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const address = order.addresses;

  return (
    <div className="order-card">
      <div className="order-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="order-card-id">
          <Package size={18} className="order-card-icon" />
          <div>
            <span className="order-card-label">Order</span>
            <span className="order-card-number">#{order.id}</span>
          </div>
        </div>

        <div className="order-card-meta">
          <span className="order-card-date">{date}</span>
          <span className={`badge ${statusClass}`}>{order.status}</span>
          <span className="order-card-total">₹{Number(order.total_amount).toLocaleString()}</span>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div className="order-card-details">
          {/* Delivery Address */}
          {address && (
            <div className="order-card-address">
              <h4><MapPin size={14} /> Delivery Address</h4>
              <p className="order-addr-name">{address.full_name}</p>
              <p>{address.address_line}</p>
              <p>{address.city}, {address.state} — {address.pincode}</p>
              <p>Phone: {address.phone}</p>
            </div>
          )}

          {/* Payment Method */}
          {order.payment_method && (
            <div className="order-card-payment">
              <CreditCard size={14} />
              <span>{paymentLabels[order.payment_method] || order.payment_method}</span>
            </div>
          )}

          {/* Items */}
          <div className="order-card-items">
            <div className="order-items-header">
              <span>Product</span>
              <span>Qty</span>
              <span>Price</span>
            </div>
            {order.order_items.map((item) => {
              const productName = productsMap?.[item.product_id] || `Product #${item.product_id}`;
              return (
                <div key={item.id} className="order-item-row">
                  <span className="order-item-name">{productName}</span>
                  <span className="order-item-qty">×{item.quantity}</span>
                  <span className="order-item-price">₹{Number(item.price).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
