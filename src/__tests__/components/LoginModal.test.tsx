import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginModal from '@/components/LoginModal';
import { toast } from 'sonner';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock SESv2Client and ListEmailTemplatesCommand
vi.mock('@aws-sdk/client-sesv2', () => {
  return {
    SESv2Client: vi.fn().mockImplementation(() => ({
      send: vi.fn().mockResolvedValue({}),
    })),
    ListEmailTemplatesCommand: vi.fn(),
  };
});

const mockOnOpenChange = vi.fn();

const renderComponent = () =>
  render(
    <BrowserRouter>
      <LoginModal isOpen={true} onOpenChange={mockOnOpenChange} />
    </BrowserRouter>
  );

describe('LoginModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders correctly', () => {
    renderComponent();

    expect(screen.getByText('Login to Amazon SES Manager')).toBeInTheDocument();
    expect(screen.getByLabelText('AWS Region')).toBeInTheDocument();
    expect(screen.getByLabelText('Access Key ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Secret Access Key')).toBeInTheDocument();
  });

  it('shows error if credentials are incomplete', async () => {
    const user = userEvent.setup();

    renderComponent();

    user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please enter your AWS credentials'
      );
    });
  });

  it('logs in successfully with valid credentials', async () => {
    const ses = await import('@aws-sdk/client-sesv2');
    const user = userEvent.setup();

    renderComponent();

    const trigger = screen.getByRole('combobox', {
      name: 'region',
    });
    expect(trigger).toBeInTheDocument();
    expect(within(trigger).getByText('Select a region')).toBeInTheDocument();
    await user.click(trigger);

    const firstOption = screen.getByRole('option', { name: 'us-east-1' });
    expect(firstOption).toBeInTheDocument();
    await user.click(firstOption);

    await user.type(screen.getByLabelText('Access Key ID'), 'mockKey');
    await user.type(screen.getByLabelText('Secret Access Key'), 'mockSecret');

    user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(ses.SESv2Client).toHaveBeenCalled();
      expect(localStorage.getItem('awsCredentials')).toContain('mockKey');
      expect(toast.success).toHaveBeenCalledWith('Successfully logged in');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows error on login failure', async () => {
    const ses = await import('@aws-sdk/client-sesv2');
    const user = userEvent.setup();
    // Force client.send to throw error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ses.SESv2Client as any).mockImplementation(() => ({
      send: vi.fn().mockRejectedValue(new Error('Bad credentials')),
    }));

    renderComponent();

    await user.click(
      screen.getByRole('combobox', {
        name: 'region',
      })
    );
    await user.click(screen.getByRole('option', { name: 'us-east-1' }));

    await user.type(screen.getByLabelText('Access Key ID'), 'badKey');
    await user.type(screen.getByLabelText('Secret Access Key'), 'badSecret');

    user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Login failed. Please check your credentials and try again.'
      );
    });
  });
});
