import { useState } from 'react';
import { FALLBACK_IMAGE } from '../data/productMeta';

export default function ProductImage({ src, alt, className = '' }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`product-image-wrapper ${className}`}>
      <img
        src={imgSrc}
        alt={alt || 'Product'}
        loading="lazy"
        className={`product-image ${loaded ? 'loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => setImgSrc(FALLBACK_IMAGE)}
      />
    </div>
  );
}
