import { ShoppingCart, Mail, Phone, MapPin, Truck, Shield, RotateCcw, Headphones } from 'lucide-react';
import './Footer.css';

export default function Footer({ navigate }) {
  return (
    <footer className="footer">
      {/* Trust Banner - above the main footer */}
      <div className="footer-trust">
        <div className="container footer-trust-inner">
          <div className="footer-trust-item">
            <div className="footer-trust-icon"><Truck size={24} /></div>
            <div>
              <span className="footer-trust-title">Fast Delivery</span>
              <span className="footer-trust-desc">Free shipping on orders above ₹499</span>
            </div>
          </div>
          <div className="footer-trust-item">
            <div className="footer-trust-icon"><Shield size={24} /></div>
            <div>
              <span className="footer-trust-title">Secure Payments</span>
              <span className="footer-trust-desc">100% secure payment gateway</span>
            </div>
          </div>
          <div className="footer-trust-item">
            <div className="footer-trust-icon"><RotateCcw size={24} /></div>
            <div>
              <span className="footer-trust-title">Easy Returns</span>
              <span className="footer-trust-desc">7-day hassle-free returns</span>
            </div>
          </div>
          <div className="footer-trust-item">
            <div className="footer-trust-icon"><Headphones size={24} /></div>
            <div>
              <span className="footer-trust-title">24/7 Support</span>
              <span className="footer-trust-desc">Dedicated customer service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="footer-inner container">
          <div className="footer-brand">
            <div className="footer-logo">
              <ShoppingCart size={24} />
              <span>CartScale</span>
            </div>
            <p className="footer-desc">
              Your one-stop destination for everything you need.
              Shop smarter, save more with CartScale.
            </p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <button className="footer-link" onClick={() => navigate('home')}>Home</button>
            <button className="footer-link" onClick={() => navigate('cart')}>Cart</button>
            <button className="footer-link" onClick={() => navigate('orders')}>My Orders</button>
            <button className="footer-link" onClick={() => navigate('login')}>Account</button>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Customer Service</h4>
            <span className="footer-link">Help Center</span>
            <span className="footer-link">Shipping Info</span>
            <span className="footer-link">Returns & Refunds</span>
            <span className="footer-link">FAQ</span>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Legal</h4>
            <span className="footer-link">Privacy Policy</span>
            <span className="footer-link">Terms of Service</span>
            <span className="footer-link">Cookie Policy</span>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact Us</h4>
            <span className="footer-contact"><Mail size={14} /> support@cartscale.com</span>
            <span className="footer-contact"><Phone size={14} /> +91 98765 43210</span>
            <span className="footer-contact"><MapPin size={14} /> Bangalore, India</span>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2026 CartScale. All rights reserved.</p>
          <p>Built with ❤️ for smart shoppers</p>
        </div>
      </div>
    </footer>
  );
}
