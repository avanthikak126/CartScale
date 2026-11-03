import { categoryMeta, categoryIconMap, categoryColorMap } from '../data/productMeta';
import * as LucideIcons from 'lucide-react';
import './CategoryCard.css';

export default function CategoryCard({ category, isActive, onClick }) {
  const name = (category.name || '').toLowerCase();
  const iconName = categoryIconMap[name] || 'Tag';
  const color = categoryColorMap[name] || '#6366f1';
  const Icon = LucideIcons[iconName] || LucideIcons.Tag;
  const meta = categoryMeta[name] || {};

  return (
    <button
      className={`category-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(category)}
      style={{ '--cat-color': color }}
    >
      <div className="category-icon-wrapper">
        {meta.emoji ? (
          <span className="category-emoji">{meta.emoji}</span>
        ) : (
          <Icon size={26} />
        )}
      </div>
      <span className="category-name">{category.name}</span>
      {meta.label && <span className="category-label">{meta.label}</span>}
    </button>
  );
}
