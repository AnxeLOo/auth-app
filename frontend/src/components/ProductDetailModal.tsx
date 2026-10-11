import React, { useEffect, useState } from 'react';
import { Product } from '../types/product.types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (product) {
      setActiveImage(product.thumbnail || product.images?.[0] || '');
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [product, onClose]);

  if (!product) return null;

  const originalPrice = product.discountPercentage > 0
    ? (product.price / (1 - product.discountPercentage / 100)).toFixed(2)
    : null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      data-testid="product-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-product-title"
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        data-testid="product-detail-modal"
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Fechar modal"
          data-testid="close-modal-btn"
        >
          ✕
        </button>

        <div className="modal-content-grid">
          {/* Coluna da Imagem */}
          <div className="modal-gallery">
            <div className="modal-main-image-wrap">
              <img
                src={activeImage}
                alt={product.title}
                className="modal-main-image"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://placehold.co/600x450/1e293b/94a3b8?text=Sem+Imagem';
                }}
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="modal-thumbnails-strip">
                {product.images.slice(0, 4).map((img, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={`modal-thumb-btn ${activeImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                  >
                    <img src={img} alt={`${product.title} preview ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coluna de Informações */}
          <div className="modal-details">
            <div className="modal-badges-row">
              <span className="badge badge-category">{product.category}</span>
              {product.brand && <span className="badge badge-brand">{product.brand}</span>}
              <span className="badge badge-stock">
                {product.stock > 0 ? `Estoque: ${product.stock} un.` : 'Sem estoque'}
              </span>
            </div>

            <h2 id="modal-product-title" className="modal-title">
              {product.title}
            </h2>

            <div className="modal-rating-row">
              <span className="modal-rating-stars">⭐ {product.rating.toFixed(2)}</span>
              <span className="modal-rating-text">Classificação DummyJSON</span>
            </div>

            <div className="modal-price-box">
              <div className="modal-prices">
                <span className="modal-current-price">${product.price.toFixed(2)}</span>
                {originalPrice && (
                  <span className="modal-old-price">${originalPrice}</span>
                )}
              </div>
              {product.discountPercentage > 0 && (
                <span className="modal-discount-tag">
                  Economize {Math.round(product.discountPercentage)}%
                </span>
              )}
            </div>

            <div className="modal-description-section">
              <h4 className="modal-section-heading">Descrição do Produto</h4>
              <p className="modal-description-text">{product.description}</p>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="modal-tags-section">
                <span className="modal-tags-label">Tags:</span>
                <div className="modal-tags-list">
                  {product.tags.map((tag) => (
                    <span key={tag} className="code-pill">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={onClose}
                data-testid="modal-confirm-btn"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
