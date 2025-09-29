import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

// Mock LoginModal to avoid rendering complexity
vi.mock('@/components/LoginModal', () => ({
  default: () => <div data-testid="login-modal" />,
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

const LoginPage = () => <div>You are on the Login Page</div>;

const renderComponent = (initialPath = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={<Layout />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Layout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders navigation links', () => {
    renderComponent();

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /email templates/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /contact lists/i })
    ).toBeInTheDocument();
  });

  it('shows login button when not logged in', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /logout/i })).not.toBeInTheDocument();
  });

  it('shows logout button when logged in', () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));
    renderComponent();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
  });

  it('toggles dark mode when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const toggleButton = screen.getByRole('button', {
      name: /toggle dark mode/i,
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    await user.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('logs out and navigates to login', async () => {
    const user = userEvent.setup();
    localStorage.setItem('awsCredentials', JSON.stringify({}));
    renderComponent();

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(localStorage.getItem('awsCredentials')).toBeNull();
    expect(toast.success).toHaveBeenCalledWith(
      'Successfully logged out'
    );
  });

  test('navigates to /login when the Login button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeInTheDocument();

    await user.click(loginButton);

    // We expect to see the content of our mocked LoginPage
    expect(screen.getByText('You are on the Login Page')).toBeInTheDocument();
  });

  it('renders footer with current year', () => {
    renderComponent();
    const year = new Date().getFullYear();
    expect(
      screen.getByText(`Amazon SES Manager © ${year}`)
    ).toBeInTheDocument();
  });
});
