/* Product metadata mapping for frontend-only enrichment.
   The backend only returns { id, name, price, category_id }.
   This file adds images, ratings, discounts WITHOUT touching the DB. */

import dummyProductMeta from './dummyProductMeta.json';

const productMetaMap = {
  iphone: {
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 2847,
    discount: 12,
    badge: 'Bestseller',
  },
  headphone: {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 1523,
    discount: 15,
  },
  headphones: {
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 1523,
    discount: 15,
  },
  keyboard: {
    image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 892,
    discount: 20,
    badge: 'Popular',
  },
  mouse: {
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 1105,
    discount: 18,
  },
  't-shirt': {
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80',
    rating: 4.1,
    reviewCount: 3421,
    discount: 30,
    badge: 'Deal',
  },
  shirt: {
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80',
    rating: 4.1,
    reviewCount: 3421,
    discount: 30,
  },
  cotton: {
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&q=80',
    rating: 4.1,
    reviewCount: 3421,
    discount: 30,
  },
  'clean code': {
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop&q=80',
    rating: 4.8,
    reviewCount: 5670,
    discount: 10,
    badge: 'Top Rated',
  },
  book: {
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 2100,
    discount: 10,
  },
  laptop: {
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 1890,
    discount: 8,
  },
  watch: {
    image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop&q=80',
    rating: 4.2,
    reviewCount: 980,
    discount: 22,
  },
  smartwatch: {
    image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&h=400&fit=crop&q=80',
    rating: 4.2,
    reviewCount: 980,
    discount: 22,
  },
  camera: {
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 1340,
    discount: 14,
  },
  speaker: {
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 760,
    discount: 16,
  },
  tablet: {
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 1650,
    discount: 11,
  },
  earbuds: {
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop&q=80',
    rating: 4.2,
    reviewCount: 2310,
    discount: 25,
  },
  airpods: {
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop&q=80',
    rating: 4.2,
    reviewCount: 2310,
    discount: 25,
  },
  charger: {
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop&q=80',
    rating: 4.0,
    reviewCount: 890,
    discount: 35,
  },
  cable: {
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop&q=80',
    rating: 4.0,
    reviewCount: 890,
    discount: 35,
  },
  monitor: {
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 1120,
    discount: 12,
  },
  display: {
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 1120,
    discount: 12,
  },
  gaming: {
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 1450,
    discount: 15,
  },
  console: {
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 1450,
    discount: 15,
  },
  phone: {
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 1980,
    discount: 14,
  },
  smartphone: {
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 1980,
    discount: 14,
  },
  bag: {
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&q=80',
    rating: 4.1,
    reviewCount: 640,
    discount: 28,
  },
  backpack: {
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&q=80',
    rating: 4.1,
    reviewCount: 640,
    discount: 28,
  },
  shoe: {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 1870,
    discount: 20,
  },
  sneaker: {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 1870,
    discount: 20,
  },
  'air fryer': {
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 2200,
    discount: 18,
  },
  kitchen: {
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 2200,
    discount: 18,
  },
  appliance: {
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&q=80',
    rating: 4.5,
    reviewCount: 2200,
    discount: 18,
  },
  dress: {
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a0a?w=400&h=400&fit=crop&q=80',
    rating: 4.2,
    reviewCount: 1240,
    discount: 25,
  },
  fashion: {
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a0a?w=400&h=400&fit=crop&q=80',
    rating: 4.2,
    reviewCount: 1240,
    discount: 25,
  },
  sunglasses: {
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop&q=80',
    rating: 4.4,
    reviewCount: 890,
    discount: 15,
  },
  perfume: {
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 3100,
    discount: 5,
  },
  fragrance: {
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&q=80',
    rating: 4.7,
    reviewCount: 3100,
    discount: 5,
  },
  wallet: {
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop&q=80',
    rating: 4.3,
    reviewCount: 750,
    discount: 10,
  },
  'power bank': {
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 1560,
    discount: 12,
  },
  battery: {
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop&q=80',
    rating: 4.6,
    reviewCount: 1560,
    discount: 12,
  },
};

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80';

export const categoryFallbackImages = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop&q=80',
  mobiles: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80',
  audio: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80',
  gaming: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop&q=80',
  fashion: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a0a?w=400&h=400&fit=crop&q=80',
  'home & kitchen': 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&q=80',
  accessories: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80',
  books: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop&q=80',
};

export const categoryMeta = {
  mobiles: {
    emoji: '📱',
    label: 'Smartphones & Accessories',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
  },
  laptops: {
    emoji: '💻',
    label: 'Laptops & Computers',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
  },
  audio: {
    emoji: '🎧',
    label: 'Headphones & Speakers',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
  },
  gaming: {
    emoji: '🎮',
    label: 'Consoles & Accessories',
    image: 'https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
  },
  fashion: {
    emoji: '👕',
    label: 'Clothing & Apparel',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a0a?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
  },
  'home & kitchen': {
    emoji: '🍳',
    label: 'Home Appliances',
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
  },
  accessories: {
    emoji: '⌚',
    label: 'Watches & Wearables',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #eab308 0%, #facc15 100%)',
  },
  books: {
    emoji: '📚',
    label: 'Books & Literature',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop&q=80',
    gradient: 'linear-gradient(135deg, #84cc16 0%, #a3e635 100%)',
  }
};

export const HIDDEN_PRODUCT_NAMES = ['test product', 'test product 2', 'test product 3'];

export function isTestProduct(product) {
  const name = (product.name || '').toLowerCase().trim();
  return HIDDEN_PRODUCT_NAMES.some(hidden => name === hidden || name.startsWith('test product'));
}

export function deduplicateProducts(products) {
  const seen = new Set();
  return products.filter(p => {
    const key = (p.name || '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Deterministic pseudo-random from a numeric seed */
function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

/**
 * Merge backend product with frontend-only metadata.
 * @param {{ id: number, name: string, price: number }} product
 */
export function getProductMeta(product) {
  const name = (product.name || '').toLowerCase().trim();
  const id = product.id || 0;

  // Use database fields if they exist
  let image = product.image_url;
  let rating = product.rating ? Number(product.rating) : null;
  let discount = product.discount_percentage ? Number(product.discount_percentage) : null;

  // Fallback to JSON mapping if DB fields are missing
  if ((!image || !rating || !discount) && dummyProductMeta && dummyProductMeta[name]) {
    const dummy = dummyProductMeta[name];
    image = image || dummy.image;
    rating = rating || dummy.rating;
    discount = discount || dummy.discount;
  }

  // Fallback to internal mapping if still missing
  if (!image || !rating || !discount) {
    for (const [key, value] of Object.entries(productMetaMap)) {
      if (name.includes(key)) {
        image = image || value.image;
        rating = rating || value.rating;
        discount = discount || value.discount;
        break;
      }
    }
  }

  // Final deterministic defaults
  image = image || FALLBACK_IMAGE;
  rating = rating || +(4.0 + seededRandom(id) * 0.8).toFixed(1);
  discount = discount || (5 + Math.floor(seededRandom(id + 2) * 25));
  
  const reviewCount = 100 + Math.floor(seededRandom(id + 1) * 2000);
  const badge = rating >= 4.7 ? 'Top Rated' : discount >= 15 ? 'Hot Deal' : null;

  const result = {
    image,
    rating,
    reviewCount,
    discount,
    badge,
  };

  if (product.price) {
    result.originalPrice = Math.round(product.price / (1 - result.discount / 100));
  }

  return result;
}

export function getCuratedSections(products) {
  // Filter out test products and deduplicate
  const clean = deduplicateProducts(products.filter(p => !isTestProduct(p)));
  
  // Deals of the Day: products with discount >= 15%, take up to 6
  const deals = clean.filter(p => {
    const meta = getProductMeta(p);
    return meta.discount >= 15;
  }).slice(0, 6);
  
  // Featured: products with rating >= 4.3, exclude deals, take up to 6
  const dealIds = new Set(deals.map(p => p.id));
  const featured = clean.filter(p => {
    if (dealIds.has(p.id)) return false;
    const meta = getProductMeta(p);
    return meta.rating >= 4.3;
  }).slice(0, 6);
  
  // Trending: remaining products not in deals or featured, take up to 6
  const featuredIds = new Set(featured.map(p => p.id));
  const trending = clean.filter(p => !dealIds.has(p.id) && !featuredIds.has(p.id)).slice(0, 6);
  
  return { deals, featured, trending, all: clean };
}

/** Category → lucide-react icon name mapping */
export const categoryIconMap = {
  electronics: 'Cpu',
  mobiles: 'Smartphone',
  phones: 'Smartphone',
  computers: 'Monitor',
  laptops: 'Laptop',
  gaming: 'Gamepad2',
  audio: 'Headphones',
  accessories: 'Watch',
  fashion: 'Shirt',
  clothing: 'Shirt',
  home: 'Home',
  'home & kitchen': 'UtensilsCrossed',
  books: 'BookOpen',
  sports: 'Dumbbell',
  beauty: 'Sparkles',
  toys: 'Gift',
  food: 'UtensilsCrossed',
  kitchen: 'ChefHat',
  office: 'Briefcase',
};

/** Category → accent color mapping */
export const categoryColorMap = {
  electronics: '#3b82f6',
  mobiles: '#8b5cf6',
  phones: '#8b5cf6',
  computers: '#06b6d4',
  laptops: '#06b6d4',
  gaming: '#ef4444',
  audio: '#f97316',
  accessories: '#eab308',
  fashion: '#ec4899',
  clothing: '#ec4899',
  home: '#14b8a6',
  'home & kitchen': '#14b8a6',
  books: '#84cc16',
  sports: '#f59e0b',
  beauty: '#d946ef',
  toys: '#6366f1',
  food: '#22c55e',
  kitchen: '#0d9488',
  office: '#6366f1',
};
