import { dummyApi } from './dummyApi';
import {
  Product,
  ProductsResponse,
  ProductCategory,
  FetchProductsParams,
} from '../types/product.types';

export const productsService = {
  /**
   * Obtém lista de produtos com suporte a paginação, busca e filtro por categoria
   */
  async getProducts(params: FetchProductsParams = {}): Promise<ProductsResponse> {
    const { limit = 8, skip = 0, search, category } = params;

    let endpoint = '/products';
    const queryParams: Record<string, string | number> = {
      limit,
      skip,
    };

    if (category && category.trim()) {
      endpoint = `/products/category/${encodeURIComponent(category.trim())}`;
    } else if (search && search.trim()) {
      endpoint = '/products/search';
      queryParams.q = search.trim();
    }

    const response = await dummyApi.get<ProductsResponse>(endpoint, {
      params: queryParams,
    });

    return response.data;
  },

  /**
   * Obtém lista de categorias de produtos disponíveis na DummyJSON
   */
  async getCategories(): Promise<ProductCategory[]> {
    const response = await dummyApi.get<Array<string | ProductCategory>>('/products/categories');
    
    // Normaliza retorno da DummyJSON para array padronizado de ProductCategory
    return response.data.map((item) => {
      if (typeof item === 'string') {
        const readableName = item
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
        return {
          slug: item,
          name: readableName,
          url: `/products/category/${item}`,
        };
      }
      return item;
    });
  },

  /**
   * Obtém detalhes de um produto específico por ID
   */
  async getProductById(id: number): Promise<Product> {
    const response = await dummyApi.get<Product>(`/products/${id}`);
    return response.data;
  },
};
