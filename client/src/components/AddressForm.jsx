import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AddressForm.css';

const INITIAL = { full_name: '', phone: '', address_line: '', city: '', state: '', pincode: '' };

export default function AddressForm({ address, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (address) {
      setForm({
        full_name: address.full_name || '',
        phone: address.phone || '',
        address_line: address.address_line || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
  }, [address]);

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim()) errs.full_name = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (!/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Enter a valid 10-digit phone number';
    if (!form.address_line.trim()) errs.address_line = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(form.pincode.trim())) errs.pincode = 'Enter a valid 6-digit pincode';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const isEditing = !!address;

  return (
    <div className="address-form-overlay" onClick={onCancel}>
      <div className="address-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="address-form-header">
          <h3>{isEditing ? 'Edit Address' : 'Add New Address'}</h3>
          <button className="address-form-close" onClick={onCancel}><X size={20} /></button>
        </div>

        <form className="address-form" onSubmit={handleSubmit}>
          <div className="address-form-row">
            <div className="address-form-field">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Avanthika K"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
              />
              {errors.full_name && <span className="address-form-error">{errors.full_name}</span>}
            </div>
            <div className="address-form-field">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                maxLength={10}
              />
              {errors.phone && <span className="address-form-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="address-form-field">
            <label>House / Flat / Building / Street / Area</label>
            <input
              type="text"
              placeholder="e.g. 42, MG Road, Sector 5"
              value={form.address_line}
              onChange={(e) => handleChange('address_line', e.target.value)}
            />
            {errors.address_line && <span className="address-form-error">{errors.address_line}</span>}
          </div>

          <div className="address-form-row address-form-row-3">
            <div className="address-form-field">
              <label>City</label>
              <input
                type="text"
                placeholder="e.g. Kochi"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
              {errors.city && <span className="address-form-error">{errors.city}</span>}
            </div>
            <div className="address-form-field">
              <label>State</label>
              <input
                type="text"
                placeholder="e.g. Kerala"
                value={form.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
              {errors.state && <span className="address-form-error">{errors.state}</span>}
            </div>
            <div className="address-form-field">
              <label>Pincode</label>
              <input
                type="text"
                placeholder="6-digit pincode"
                value={form.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                maxLength={6}
              />
              {errors.pincode && <span className="address-form-error">{errors.pincode}</span>}
            </div>
          </div>

          <div className="address-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEditing ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
