import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '@/pages/Login';

vi.mock('@/components/LoginModal', () => ({
  default: ({
    isOpen,
    onOpenChange,
  }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
  }) => {
    // If the modal isn't open, render nothing.
    if (!isOpen) {
      return null;
    }
    // Render a mock component that allows us to simulate closing it.
    return (
      <div data-testid="login-modal">
        <button onClick={() => onOpenChange(false)}>Close Modal</button>
      </div>
    );
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should redirect to home if user credentials exist in localStorage', () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('should render the LoginModal if user is not logged in', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // The modal should be visible, and no redirection should occur on mount
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect to home when the modal is closed by the user', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Ensure the modal is visible initially
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();

    // Simulate the user closing the modal via our mocked button
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    await user.click(closeButton);

    // Check that closing the modal triggered the navigation
    expect(mockNavigate).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Assert that the modal is no longer in the document
    expect(screen.queryByTestId('login-modal')).not.toBeInTheDocument();
  });
});
