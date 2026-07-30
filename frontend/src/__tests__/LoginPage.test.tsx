import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

const mockRouterPush = vi.fn();
const mockLogin = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入邮箱')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入密码')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '登录' })).toBeInTheDocument();
  });

  it('has a link to register page', () => {
    render(<LoginPage />);
    const registerLink = screen.getByRole('link', { name: /立即注册/ });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('calls login and redirects on successful submit', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('请输入邮箱'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'test@test.com', password: '123456' });
      expect(mockRouterPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('邮箱或密码错误'));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('请输入邮箱'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('请输入密码'), 'wrong');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByText('邮箱或密码错误')).toBeInTheDocument();
    });
  });

  it('disables button while submitting', async () => {
    let resolveLogin: () => void;
    mockLogin.mockReturnValue(new Promise<void>((resolve) => { resolveLogin = resolve; }));
    const user = userEvent.setup();

    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('请输入邮箱'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('请输入密码'), '123456');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('登录中...')).toBeInTheDocument();

    resolveLogin!();
  });
});