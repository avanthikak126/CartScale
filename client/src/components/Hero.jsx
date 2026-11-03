import './Hero.css';
import { ArrowRight, Truck, Shield, RotateCcw } from 'lucide-react';

const Hero = ({ onShopNow, onExploreDeals }) => {
  return (
    <section className="hero">
      <div className="hero-bg-pattern" />
      <div className="hero-content container">
        <div className="hero-text">
          <span className="hero-badge">🔥 New Season Arrivals</span>
          <h1 className="hero-title">
            Big deals.<br/>
            <span className="hero-accent">Better choices.</span>
          </h1>
          <p className="hero-subtitle">
            Discover products you'll actually love. Shop smarter with CartScale — 
            from electronics to fashion, all in one place.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={onShopNow}>
              Shop Electronics <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary btn-lg hero-secondary" onClick={onExploreDeals}>
              Explore Deals
            </button>
          </div>
          <div className="hero-trust-badges">
            <div className="hero-trust-item"><Truck size={16}/> Free Delivery</div>
            <div className="hero-trust-item"><Shield size={16}/> Secure Payments</div>
            <div className="hero-trust-item"><RotateCcw size={16}/> Easy Returns</div>
          </div>
        </div>
        
        <div className="hero-visual">
          <div className="hero-image-grid">
            <img 
              src="https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=400&fit=crop" 
              alt="Smartphone" 
              className="hero-img hero-img-main" 
            />
            <img 
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=260&h=180&fit=crop" 
              alt="Headphones" 
              className="hero-img hero-img-secondary" 
            />
            <img 
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=260&h=180&fit=crop" 
              alt="Sneakers" 
              className="hero-img hero-img-tertiary" 
            />
          </div>
          <div className="hero-floating-card">
            <span className="hero-floating-discount">30% OFF</span>
            <span className="hero-floating-text">Summer Sale</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
