import { render, screen } from '@testing-library/react';
import GoodsCard from '@/components/GoodsCard';
import type { Goods } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const baseGoods: Goods = {
  id: 1,
  title: '测试商品',
  price: 99.99,
  images: [],
  status: 'Approved',
  createdAt: '2026-07-01T00:00:00.000Z',
};

describe('GoodsCard', () => {
  it('renders title and price', () => {
    render(<GoodsCard goods={baseGoods} />);
    expect(screen.getByText('测试商品')).toBeInTheDocument();
    expect(screen.getByText('¥99.99')).toBeInTheDocument();
  });

  it('shows placeholder when no image', () => {
    render(<GoodsCard goods={baseGoods} />);
    expect(screen.getByText('暂无图片')).toBeInTheDocument();
  });

  it('shows image when images exist', () => {
    const goods: Goods = { ...baseGoods, images: ['https://example.com/pic.jpg'] };
    render(<GoodsCard goods={goods} />);
    const img = screen.getByAltText('测试商品') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/pic.jpg');
  });

  it('shows category name', () => {
    const goods: Goods = { ...baseGoods, category: { id: 1, name: '数码电子' } };
    render(<GoodsCard goods={goods} />);
    expect(screen.getByText('数码电子')).toBeInTheDocument();
  });

  it('shows "未分类" when no category', () => {
    render(<GoodsCard goods={baseGoods} />);
    expect(screen.getByText('未分类')).toBeInTheDocument();
  });

  it('links to correct detail page', () => {
    render(<GoodsCard goods={baseGoods} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/goods/1');
  });

  it('formats createdAt as Chinese date', () => {
    render(<GoodsCard goods={baseGoods} />);
    expect(screen.getByText('2026/7/1')).toBeInTheDocument();
  });
});