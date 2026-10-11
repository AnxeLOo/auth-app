import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Product, ProductCategory } from '../types/product.types';
import { productsService } from '../services/products.service';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { Spinner } from './Spinner';
import { Alert } from './Alert';

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [skip, setSkip] = useState<number>(0);
  const limit = 8;

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Debounce para busca
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setSkip(0); // Reseta para a primeira página ao buscar
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSkip(0);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSearchQuery('');
    setDebouncedSearch('');
    setSkip(0);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('');
    setSkip(0);
  };

  // Carrega categorias da API
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const cats = await productsService.getCategories();
        if (isMounted) setCategories(cats);
      } catch (err) {
        console.warn('Falha ao carregar categorias da DummyJSON:', err);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carrega produtos
  const fetchProductsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await productsService.getProducts({
        limit,
        skip,
        category: selectedCategory,
        search: debouncedSearch,
      });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch {
      setError('Erro ao carregar dados da API DummyJSON. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  }, [limit, skip, selectedCategory, debouncedSearch]);

  useEffect(() => {
    fetchProductsList();
  }, [fetchProductsList]);

  // Paginação
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;
  const hasNextPage = skip + limit < total;
  const hasPrevPage = skip > 0;

  const handleNextPage = () => {
    if (hasNextPage) {
      setSkip((prev) => prev + limit);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setSkip((prev) => Math.max(0, prev - limit));
    }
  };

  return (
    <section className="catalog-section" data-testid="product-catalog-section">
      <div className="catalog-header">
        <div>
          <div className="catalog-badge">
            <span className="pulse-dot"></span>
            Dummy Data API Integration
          </div>
          <h2 className="catalog-title">🛍️ Catálogo de Produtos Simulados</h2>
          <p className="catalog-subtitle">
            Consumo em tempo real da API pública <code>dummyjson.com/products</code> com busca,
            filtros por categoria e detalhes completos.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchProductsList}
          className="btn btn-outline btn-sm"
          disabled={isLoading}
          data-testid="refresh-products-btn"
          title="Recarregar dados da API DummyJSON"
        >
          {isLoading ? <Spinner size="sm" /> : '↻ Atualizar API'}
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="catalog-controls-card">
        <div className="search-input-group">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input search-input"
            placeholder="Buscar por nome, marca ou descrição..."
            value={searchQuery}
            onChange={handleSearchChange}
            data-testid="product-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={handleClearSearch}
              aria-label="Limpar busca"
              data-testid="clear-search-btn"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            className="input select-input"
            value={selectedCategory}
            onChange={handleCategoryChange}
            data-testid="category-select"
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {(selectedCategory || searchQuery) && (
            <button
              type="button"
              className="btn btn-outline btn-sm reset-filter-btn"
              onClick={handleResetFilters}
              data-testid="reset-filters-btn"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Erro */}
      {error && (
        <Alert
          type="error"
          message={error}
          testId="catalog-error-alert"
        />
      )}

      {/* Estado de Carregamento */}
      {isLoading ? (
        <div className="catalog-loading-state" data-testid="catalog-loading-state">
          <Spinner size="lg" />
          <p className="catalog-loading-text">
            Consultando API simulada DummyJSON...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="catalog-empty-state" data-testid="catalog-empty-state">
          <span className="empty-icon">🔎</span>
          <h3>Nenhum produto encontrado</h3>
          <p>
            Tente buscar por outro termo ou selecione uma categoria diferente.
          </p>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleResetFilters}
          >
            Ver todos os produtos
          </button>
        </div>
      ) : (
        <>
          {/* Grid de Produtos */}
          <div className="products-grid" data-testid="products-grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>

          {/* Paginação */}
          <div className="catalog-pagination" data-testid="catalog-pagination">
            <span className="pagination-info" data-testid="pagination-info">
              Exibindo <strong>{skip + 1}</strong> - <strong>{Math.min(skip + limit, total)}</strong> de{' '}
              <strong>{total}</strong> produtos (Pág. {currentPage} de {totalPages})
            </span>

            <div className="pagination-buttons">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handlePrevPage}
                disabled={!hasPrevPage}
                data-testid="pagination-prev-btn"
              >
                ← Anterior
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleNextPage}
                disabled={!hasNextPage}
                data-testid="pagination-next-btn"
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalhes do Produto */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
};
