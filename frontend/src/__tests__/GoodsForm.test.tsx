import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoodsForm from '@/components/GoodsForm';

const mockOnSubmit = vi.fn();
const mockApiGet = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
  },
}));

const categories = [
  { id: 1, name: '数码电子' },
  { id: 2, name: '图书教材' },
];

describe('GoodsForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiGet.mockResolvedValue({ data: categories });
  });

  it('renders all form fields', async () => {
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('商品标题')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText('商品描述')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提交' })).toBeInTheDocument();
  });

  it('loads categories on mount', async () => {
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/categories');
    });
  });

  it('shows category options after loading', async () => {
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('数码电子')).toBeInTheDocument();
      expect(screen.getByText('图书教材')).toBeInTheDocument();
    });
  });

  it('shows validation error when price is invalid', async () => {
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('数码电子')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('商品标题'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('商品描述'), { target: { value: 'Test desc' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '-1' } });
    fireEvent.submit(screen.getByRole('button', { name: '提交' }).closest('form')!);

    await waitFor(() => {
      expect(screen.getByText('请输入有效的价格')).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when no category selected', async () => {
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('数码电子')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('商品标题'), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText('商品描述'), { target: { value: 'Test desc' } });
    fireEvent.change(screen.getByPlaceholderText('0.00'), { target: { value: '99' } });
    fireEvent.submit(screen.getByRole('button', { name: '提交' }).closest('form')!);

    await waitFor(() => {
      const errorDivs = screen.getAllByText('请选择分类');
      expect(errorDivs.length).toBeGreaterThanOrEqual(1);
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data', async () => {
    mockOnSubmit.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('数码电子')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('商品标题'), '二手手机');
    await user.type(screen.getByPlaceholderText('商品描述'), '九成新');
    await user.clear(screen.getByPlaceholderText('0.00'));
    await user.type(screen.getByPlaceholderText('0.00'), '599');
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: '二手手机',
        description: '九成新',
        price: 599,
        categoryId: 1,
        images: [],
      });
    });
  });

  it('shows submitting state', async () => {
    let resolveSubmit: () => void;
    mockOnSubmit.mockReturnValue(new Promise<void>((resolve) => { resolveSubmit = resolve; }));
    const user = userEvent.setup();
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('数码电子')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('商品标题'), 'Test');
    await user.type(screen.getByPlaceholderText('商品描述'), 'Test');
    await user.clear(screen.getByPlaceholderText('0.00'));
    await user.type(screen.getByPlaceholderText('0.00'), '50');
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: '提交' }));

    expect(screen.getByText('提交中...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();

    resolveSubmit!();
  });

  it('shows error when onSubmit throws', async () => {
    mockOnSubmit.mockRejectedValueOnce(new Error('价格不能为负数'));
    const user = userEvent.setup();
    render(<GoodsForm onSubmit={mockOnSubmit} />);

    await waitFor(() => {
      expect(screen.getByText('数码电子')).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText('商品标题'), 'Test');
    await user.type(screen.getByPlaceholderText('商品描述'), 'Test');
    await user.clear(screen.getByPlaceholderText('0.00'));
    await user.type(screen.getByPlaceholderText('0.00'), '50');
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: '提交' }));

    await waitFor(() => {
      expect(screen.getByText('价格不能为负数')).toBeInTheDocument();
    });
  });

  it('pre-fills fields with initialData', async () => {
    render(
      <GoodsForm
        onSubmit={mockOnSubmit}
        initialData={{
          title: '旧商品',
          description: '旧描述',
          price: 100,
          categoryId: 2,
          images: ['https://example.com/pic.jpg'],
        }}
        submitLabel="更新"
      />,
    );

    await waitFor(() => {
      const titleInput = screen.getByPlaceholderText('商品标题') as HTMLInputElement;
      expect(titleInput.value).toBe('旧商品');
    });

    const descInput = screen.getByPlaceholderText('商品描述') as HTMLTextAreaElement;
    expect(descInput.value).toBe('旧描述');

    const priceInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    expect(priceInput.value).toBe('100');

    expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument();
  });
});