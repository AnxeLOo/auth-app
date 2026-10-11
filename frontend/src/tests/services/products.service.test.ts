import { productsService } from '../../services/products.service';
import { dummyApi } from '../../services/dummyApi';

// Mock do dummyApi Axios instance
jest.mock('../../services/dummyApi', () => ({
  dummyApi: {
    get: jest.fn(),
  },
}));

describe('Products Service Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getProducts faz requisição correta sem filtros adicionais', async () => {
    const mockData = {
      products: [
        {
          id: 1,
          title: 'Essence Mascara Lash Princess',
          description: 'The Essence Mascara Lash Princess is a popular mascara.',
          category: 'beauty',
          price: 9.99,
          discountPercentage: 7.17,
          rating: 4.94,
          stock: 5,
          thumbnail: 'https://cdn.dummyjson.com/products/images/beauty/1.png',
          images: [],
        },
      ],
      total: 1,
      skip: 0,
      limit: 8,
    };

    (dummyApi.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const result = await productsService.getProducts({ limit: 8, skip: 0 });

    expect(dummyApi.get).toHaveBeenCalledWith('/products', {
      params: { limit: 8, skip: 0 },
    });
    expect(result).toEqual(mockData);
  });

  test('getProducts faz requisição correta com parâmetro de busca', async () => {
    const mockData = {
      products: [],
      total: 0,
      skip: 0,
      limit: 8,
    };

    (dummyApi.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const result = await productsService.getProducts({ search: 'phone', limit: 8, skip: 0 });

    expect(dummyApi.get).toHaveBeenCalledWith('/products/search', {
      params: { limit: 8, skip: 0, q: 'phone' },
    });
    expect(result.products).toHaveLength(0);
  });

  test('getProducts faz requisição correta filtrando por categoria', async () => {
    const mockData = {
      products: [
        {
          id: 2,
          title: 'Eyeshadow Palette',
          description: 'High quality eyeshadow',
          category: 'beauty',
          price: 19.99,
          discountPercentage: 5,
          rating: 4.5,
          stock: 10,
          thumbnail: 'https://cdn.dummyjson.com/products/images/beauty/2.png',
          images: [],
        },
      ],
      total: 1,
      skip: 0,
      limit: 8,
    };

    (dummyApi.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const result = await productsService.getProducts({ category: 'beauty', limit: 8, skip: 0 });

    expect(dummyApi.get).toHaveBeenCalledWith('/products/category/beauty', {
      params: { limit: 8, skip: 0 },
    });
    expect(result.products[0].title).toBe('Eyeshadow Palette');
  });

  test('getCategories normaliza tanto strings quanto objetos de categorias', async () => {
    const mockCategoriesFromApi = [
      'beauty',
      { slug: 'fragrances', name: 'Fragrances', url: '/products/category/fragrances' },
    ];

    (dummyApi.get as jest.Mock).mockResolvedValueOnce({ data: mockCategoriesFromApi });

    const categories = await productsService.getCategories();

    expect(dummyApi.get).toHaveBeenCalledWith('/products/categories');
    expect(categories).toEqual([
      { slug: 'beauty', name: 'Beauty', url: '/products/category/beauty' },
      { slug: 'fragrances', name: 'Fragrances', url: '/products/category/fragrances' },
    ]);
  });

  test('getProductById busca detalhes de produto específico', async () => {
    const mockProduct = {
      id: 10,
      title: 'Gucci Bloom Eau de Parfum',
      description: 'Floral fragrance',
      category: 'fragrances',
      price: 79.99,
      discountPercentage: 0,
      rating: 4.8,
      stock: 20,
      thumbnail: 'https://cdn.dummyjson.com/products/images/fragrances/10.png',
      images: ['https://cdn.dummyjson.com/products/images/fragrances/10.png'],
    };

    (dummyApi.get as jest.Mock).mockResolvedValueOnce({ data: mockProduct });

    const product = await productsService.getProductById(10);

    expect(dummyApi.get).toHaveBeenCalledWith('/products/10');
    expect(product.title).toBe('Gucci Bloom Eau de Parfum');
  });
});
