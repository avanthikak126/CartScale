import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';
import './CategorySection.css';

export default function CategorySection({ categories, selectedCategory, onSelectCategory }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const amount = 280;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!categories || categories.length === 0) return null;

  return (
    <section className="category-section">
      <div className="container">
        <div className="category-header">
          <div>
            <h2 className="section-title">Shop by Category</h2>
            <p className="category-subtitle">Browse our wide selection of products</p>
          </div>
          {selectedCategory && (
            <button className="category-clear" onClick={() => onSelectCategory(null)}>
              Show All
            </button>
          )}
        </div>
        <div className="category-scroll-wrapper">
          <button className="category-arrow category-arrow-left" onClick={() => scroll('left')}>
            <ChevronLeft size={20} />
          </button>
          <div className="category-scroll" ref={scrollRef}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                isActive={selectedCategory?.id === cat.id}
                onClick={(c) => onSelectCategory(selectedCategory?.id === c.id ? null : c)}
              />
            ))}
          </div>
          <button className="category-arrow category-arrow-right" onClick={() => scroll('right')}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
