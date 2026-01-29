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

// Mock validateS3Connection
vi.mock('@/lib/aws-s3', () => ({
  validateS3Connection: vi.fn().mockResolvedValue(true),
}));

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

    expect(screen.getByText('Login to SES Templates Manager')).toBeInTheDocument();
    expect(screen.getByLabelText('AWS Region')).toBeInTheDocument();
    expect(screen.getByLabelText('Access Key ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Secret Access Key')).toBeInTheDocument();
    expect(screen.getByLabelText('S3 Bucket Name')).toBeInTheDocument();
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

  it('shows error if S3 bucket name is missing', async () => {
    const user = userEvent.setup();

    renderComponent();

    // Fill in AWS credentials but not bucket name
    await user.click(
      screen.getByRole('combobox', {
        name: 'region',
      })
    );
    await user.click(screen.getByRole('option', { name: 'us-east-1' }));
    await user.type(screen.getByLabelText('Access Key ID'), 'mockKey');
    await user.type(screen.getByLabelText('Secret Access Key'), 'mockSecret');

    user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please enter your S3 bucket name'
      );
    });
  });

  it('logs in successfully with valid credentials', async () => {
    const s3 = await import('@/lib/aws-s3');
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
    await user.type(screen.getByLabelText('S3 Bucket Name'), 'my-bucket');

    user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(s3.validateS3Connection).toHaveBeenCalled();
      expect(localStorage.getItem('awsCredentials')).toContain('mockKey');
      expect(localStorage.getItem('awsCredentials')).toContain('my-bucket');
      expect(toast.success).toHaveBeenCalledWith('Successfully logged in');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows error on login failure', async () => {
    const s3 = await import('@/lib/aws-s3');
    const user = userEvent.setup();
    // Force validateS3Connection to return false
    vi.mocked(s3.validateS3Connection).mockResolvedValue(false);

    renderComponent();

    await user.click(
      screen.getByRole('combobox', {
        name: 'region',
      })
    );
    await user.click(screen.getByRole('option', { name: 'us-east-1' }));

    await user.type(screen.getByLabelText('Access Key ID'), 'badKey');
    await user.type(screen.getByLabelText('Secret Access Key'), 'badSecret');
    await user.type(screen.getByLabelText('S3 Bucket Name'), 'bad-bucket');

    user.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Login failed. Please check your credentials, bucket name, and try again.'
      );
    });
  });
});
