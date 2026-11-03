import { useState } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import ProductImage from './ProductImage';
import { getProductMeta } from '../data/productMeta';
import './CartItem.css';

export default function CartItem({ item, onUpdateQty, onRemove }) {
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const product = item.products;
  const meta = getProductMeta(product);
  const lineTotal = product.price * item.quantity;

  const handleQty = async (newQty) => {
    if (newQty < 1) return;
    setUpdating(true);
    await onUpdateQty(item.id, newQty);
    setUpdating(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(item.id);
  };

  return (
    <div className={`cart-item ${removing ? 'removing' : ''}`}>
      <div className="cart-item-image">
        <ProductImage src={meta.image} alt={product.name} />
      </div>

      <div className="cart-item-info">
        <h3 className="cart-item-name">{product.name}</h3>
        <p className="cart-item-price">₹{Number(product.price).toLocaleString()}</p>

        <div className="cart-item-controls">
          <div className="cart-item-qty">
            <button
              className="cart-item-qty-btn"
              onClick={() => handleQty(item.quantity - 1)}
              disabled={item.quantity <= 1 || updating}
            >
              <Minus size={14} />
            </button>
            <span className="cart-item-qty-value">{item.quantity}</span>
            <button
              className="cart-item-qty-btn"
              onClick={() => handleQty(item.quantity + 1)}
              disabled={updating}
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            className="cart-item-remove"
            onClick={handleRemove}
            disabled={removing}
          >
            <Trash2 size={15} />
            <span>Remove</span>
          </button>
        </div>
      </div>

      <div className="cart-item-subtotal">
        <span className="cart-item-subtotal-label">Subtotal</span>
        <span className="cart-item-subtotal-value">₹{lineTotal.toLocaleString()}</span>
      </div>
    </div>
  );
}
