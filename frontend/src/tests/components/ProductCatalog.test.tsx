import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCatalog } from '../../components/ProductCatalog';
import { productsService } from '../../services/products.service';

jest.mock('../../services/products.service');

const mockProductsData = {
  products: [
    {
      id: 1,
      title: 'Mascara Volume Extra',
      description: 'Uma máscara de cílios de alta performance e longa duração.',
      category: 'beauty',
      price: 15.0,
      discountPercentage: 10,
      rating: 4.8,
      stock: 12,
      thumbnail: 'https://via.placeholder.com/150',
      images: ['https://via.placeholder.com/150'],
    },
    {
      id: 2,
      title: 'Perfume Elegance',
      description: 'Fragrância marcante com notas florais.',
      category: 'fragrances',
      price: 49.9,
      discountPercentage: 0,
      rating: 4.9,
      stock: 5,
      thumbnail: 'https://via.placeholder.com/150',
      images: ['https://via.placeholder.com/150'],
    },
  ],
  total: 2,
  skip: 0,
  limit: 8,
};

const mockCategories = [
  { slug: 'beauty', name: 'Beauty', url: '/products/category/beauty' },
  { slug: 'fragrances', name: 'Fragrances', url: '/products/category/fragrances' },
];

describe('ProductCatalog Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (productsService.getCategories as jest.Mock).mockResolvedValue(mockCategories);
    (productsService.getProducts as jest.Mock).mockResolvedValue(mockProductsData);
  });

  test('renderiza catálogo com produtos e categorias carregados da API', async () => {
    render(<ProductCatalog />);

    // Verifica que o loader é exibido inicialmente
    expect(screen.getByTestId('catalog-loading-state')).toBeInTheDocument();

    // Aguarda exibição dos produtos
    await waitFor(() => {
      expect(screen.getByText('Mascara Volume Extra')).toBeInTheDocument();
      expect(screen.getByText('Perfume Elegance')).toBeInTheDocument();
    });

    // Verifica informações de paginação
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('Exibindo 1 - 2 de 2 produtos');

    // Verifica categorias no select
    const select = screen.getByTestId('category-select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Beauty' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Fragrances' })).toBeInTheDocument();
  });

  test('abre e fecha o modal de detalhes ao interagir com o produto', async () => {
    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.getByText('Mascara Volume Extra')).toBeInTheDocument();
    });

    // Clica para ver detalhes do primeiro produto
    const detailBtn = screen.getByTestId('view-product-details-1');
    fireEvent.click(detailBtn);

    // Modal aberto
    const modal = screen.getByTestId('product-detail-modal');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent('Uma máscara de cílios de alta performance e longa duração.');

    // Fecha via botão de fechar
    const closeBtn = screen.getByTestId('close-modal-btn');
    fireEvent.click(closeBtn);

    expect(screen.queryByTestId('product-detail-modal')).not.toBeInTheDocument();
  });

  test('exibe estado vazio quando nenhum produto for retornado', async () => {
    (productsService.getProducts as jest.Mock).mockResolvedValueOnce({
      products: [],
      total: 0,
      skip: 0,
      limit: 8,
    });

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.getByTestId('catalog-empty-state')).toBeInTheDocument();
      expect(screen.getByText('Nenhum produto encontrado')).toBeInTheDocument();
    });
  });

  test('exibe alerta de erro quando a chamada da API falha', async () => {
    (productsService.getProducts as jest.Mock).mockRejectedValueOnce(
      new Error('Erro de conexão com DummyJSON')
    );

    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.getByTestId('catalog-error-alert')).toBeInTheDocument();
      expect(
        screen.getByText('Erro ao carregar dados da API DummyJSON. Verifique sua conexão.')
      ).toBeInTheDocument();
    });
  });

  test('permite filtrar por categoria disparando nova busca', async () => {
    const user = userEvent.setup();
    render(<ProductCatalog />);

    await waitFor(() => {
      expect(screen.getByText('Mascara Volume Extra')).toBeInTheDocument();
    });

    const categorySelect = screen.getByTestId('category-select');
    await user.selectOptions(categorySelect, 'beauty');

    expect(productsService.getProducts).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'beauty',
        skip: 0,
      })
    );
  });
});
