import React from 'react';
import { Product } from '../types/product.types';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const originalPrice = product.discountPercentage > 0
    ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2)
    : null;

  return (
    <div className="product-card" data-testid={`product-card-${product.id}`}>
      <div className="product-card-image-wrap">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="product-card-image"
          loading="lazy"
          onError={(e) => {
            // Fallback de imagem caso a URL remota falhe
            (e.target as HTMLImageElement).src =
              'https://placehold.co/400x300/1e293b/94a3b8?text=Sem+Imagem';
          }}
        />
        <span className="product-card-category-badge">{product.category}</span>
        {product.discountPercentage > 0 && (
          <span className="product-card-discount-badge">
            -{Math.round(product.discountPercentage)}%
          </span>
        )}
      </div>

      <div className="product-card-content">
        <div className="product-card-header">
          <h3 className="product-card-title" title={product.title}>
            {product.title}
          </h3>
          <div className="product-card-rating" title={`Nota: ${product.rating} de 5`}>
            ⭐ <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        <p className="product-card-description">
          {product.description.length > 85
            ? `${product.description.slice(0, 85)}...`
            : product.description}
        </p>

        <div className="product-card-footer">
          <div className="product-card-pricing">
            <span className="product-card-price">${product.price.toFixed(2)}</span>
            {originalPrice && (
              <span className="product-card-old-price">${originalPrice}</span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm product-card-btn"
            onClick={() => onSelect(product)}
            data-testid={`view-product-details-${product.id}`}
          >
            Ver Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};
