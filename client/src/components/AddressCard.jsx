import { MapPin, Phone, User, Edit3, Trash2, Check } from 'lucide-react';
import './AddressCard.css';

export default function AddressCard({ address, isSelected, onSelect, onEdit, onDelete, deleting }) {
  return (
    <div className={`address-card ${isSelected ? 'selected' : ''}`}>
      <div className="address-card-body" onClick={() => onSelect?.(address)}>
        <div className="address-card-check">
          <div className={`address-radio ${isSelected ? 'checked' : ''}`}>
            {isSelected && <Check size={12} />}
          </div>
        </div>
        <div className="address-card-details">
          <h4 className="address-card-name">
            <User size={14} /> {address.full_name}
          </h4>
          <p className="address-card-line">{address.address_line}</p>
          <p className="address-card-city">
            <MapPin size={13} /> {address.city}, {address.state} — {address.pincode}
          </p>
          <p className="address-card-phone">
            <Phone size={13} /> {address.phone}
          </p>
        </div>
      </div>
      <div className="address-card-actions">
        <button className="address-action-btn edit" onClick={() => onEdit?.(address)}>
          <Edit3 size={14} /> Edit
        </button>
        <button
          className="address-action-btn delete"
          onClick={() => onDelete?.(address.id)}
          disabled={deleting}
        >
          <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
