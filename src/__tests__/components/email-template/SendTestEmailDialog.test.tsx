import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SendTestEmailDialog from '@/components/email-template/SendTestEmailDialog';
import { toast } from 'sonner';
import { sendTemplatedEmail } from '@/lib/aws-ses';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/aws-ses', () => ({
  sendTemplatedEmail: vi.fn(),
}));

const mockedSendTemplatedEmail = sendTemplatedEmail as unknown as ReturnType<
  typeof vi.fn
>;

describe('SendTestEmailDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    templateName: 'WelcomeTemplate',
    dynamicFields: ['name', 'product'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog with all fields when open', () => {
    render(<SendTestEmailDialog {...defaultProps} />);

    // Title and descriptions
    expect(screen.getByText('Send Test Email')).toBeInTheDocument();
    expect(
      screen.getByText(
        `Send a test email using the template "${defaultProps.templateName}".`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Note: In SES sandbox mode/)).toBeInTheDocument();

    // Inputs
    expect(screen.getByLabelText('From (Sender Email)')).toBeInTheDocument();
    expect(
      screen.getByLabelText('To (Recipient Emails, comma separated)')
    ).toBeInTheDocument();

    // Dynamic inputs
    expect(screen.getByText('Template replacement tags')).toBeInTheDocument();
    expect(screen.getByLabelText('name')).toBeInTheDocument();
    expect(screen.getByLabelText('product')).toBeInTheDocument();

    // Action buttons
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Send Email/ })
    ).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <SendTestEmailDialog {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should update input fields on user type', async () => {
    const user = userEvent.setup();
    render(<SendTestEmailDialog {...defaultProps} />);

    const fromInput = screen.getByLabelText('From (Sender Email)');
    const toInput = screen.getByLabelText(
      'To (Recipient Emails, comma separated)'
    );
    const nameInput = screen.getByLabelText('name');

    await user.type(fromInput, 'sender@test.com');
    await user.type(toInput, 'recipient@test.com');
    await user.type(nameInput, 'John Doe');

    expect(fromInput).toHaveValue('sender@test.com');
    expect(toInput).toHaveValue('recipient@test.com');
    expect(nameInput).toHaveValue('John Doe');
  });

  it('should call onClose when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<SendTestEmailDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should show an error toast if "From" email is empty on send', async () => {
    const user = userEvent.setup();
    render(<SendTestEmailDialog {...defaultProps} />);

    await user.click(screen.getByRole('button', { name: /Send Email/ }));

    expect(toast.error).toHaveBeenCalledWith(
      'Please enter a sender email address'
    );
    expect(mockedSendTemplatedEmail).not.toHaveBeenCalled();
  });

  it('should show an error toast if "To" emails are empty on send', async () => {
    const user = userEvent.setup();
    render(<SendTestEmailDialog {...defaultProps} />);

    await user.type(
      screen.getByLabelText('From (Sender Email)'),
      'sender@test.com'
    );
    await user.click(screen.getByRole('button', { name: /Send Email/ }));

    expect(toast.error).toHaveBeenCalledWith(
      'Please enter at least one recipient email address'
    );
    expect(mockedSendTemplatedEmail).not.toHaveBeenCalled();
  });

  it('should show an error toast for an invalid "From" email format', async () => {
    const user = userEvent.setup();
    render(<SendTestEmailDialog {...defaultProps} />);

    await user.type(
      screen.getByLabelText('From (Sender Email)'),
      'invalid-email'
    );
    await user.type(
      screen.getByLabelText('To (Recipient Emails, comma separated)'),
      'recipient@test.com'
    );
    await user.click(screen.getByRole('button', { name: /Send Email/ }));

    expect(toast.error).toHaveBeenCalledWith(
      'Please enter a valid sender email address'
    );
    expect(mockedSendTemplatedEmail).not.toHaveBeenCalled();
  });

  it('should show an error toast for invalid "To" email formats', async () => {
    const user = userEvent.setup();
    render(<SendTestEmailDialog {...defaultProps} />);

    await user.type(
      screen.getByLabelText('From (Sender Email)'),
      'sender@test.com'
    );
    await user.type(
      screen.getByLabelText('To (Recipient Emails, comma separated)'),
      'valid@test.com, invalid, another-bad-one'
    );
    await user.click(screen.getByRole('button', { name: /Send Email/ }));

    expect(toast.error).toHaveBeenCalledWith(
      'Invalid email format: invalid, another-bad-one'
    );
    expect(mockedSendTemplatedEmail).not.toHaveBeenCalled();
  });

  it('should call sendTemplatedEmail with correct arguments and show success on valid submission', async () => {
    const user = userEvent.setup();
    mockedSendTemplatedEmail.mockResolvedValue('test-message-id-123');
    render(<SendTestEmailDialog {...defaultProps} />);

    // Fill the form with valid data
    await user.type(
      screen.getByLabelText('From (Sender Email)'),
      'sender@test.com'
    );
    await user.type(
      screen.getByLabelText('To (Recipient Emails, comma separated)'),
      '  recipient1@test.com,recipient2@test.com  '
    );
    await user.type(screen.getByLabelText('name'), 'Alice');
    await user.type(screen.getByLabelText('product'), 'Super Widget');

    const sendButton = screen.getByRole('button', { name: /Send Email/ });
    await user.click(sendButton);
    await waitFor(() => {
      expect(mockedSendTemplatedEmail).toHaveBeenCalledWith(
        'WelcomeTemplate',
        'sender@test.com',
        ['recipient1@test.com', 'recipient2@test.com'],
        { name: 'Alice', product: 'Super Widget' }
      );
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Email sent successfully! Message ID: test-message-id-123'
    );
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should handle a generic API error gracefully', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Something went wrong';
    mockedSendTemplatedEmail.mockRejectedValue(new Error(errorMessage));
    render(<SendTestEmailDialog {...defaultProps} />);

    // Fill form
    await user.type(
      screen.getByLabelText('From (Sender Email)'),
      'sender@test.com'
    );
    await user.type(
      screen.getByLabelText('To (Recipient Emails, comma separated)'),
      'recipient@test.com'
    );

    const sendButton = screen.getByRole('button', { name: /Send Email/ });
    await user.click(sendButton);

    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        `Failed to send email: ${errorMessage}`
      );
    });

    // Ensure dialog does not close and button is re-enabled
    expect(defaultProps.onClose).not.toHaveBeenCalled();
    expect(sendButton).not.toBeDisabled();
    expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
  });

  it('should handle a specific "MessageRejected" AWS SES error', async () => {
    const user = userEvent.setup();
    const awsError = {
      name: 'MessageRejected',
      message: 'Email address is not verified.',
    };
    mockedSendTemplatedEmail.mockRejectedValue(awsError);
    render(<SendTestEmailDialog {...defaultProps} />);

    // Fill form
    await user.type(
      screen.getByLabelText('From (Sender Email)'),
      'sender@test.com'
    );
    await user.type(
      screen.getByLabelText('To (Recipient Emails, comma separated)'),
      'unverified@test.com'
    );

    const sendButton = screen.getByRole('button', { name: /Send Email/ });
    await user.click(sendButton);

    // Wait for error handling
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Email rejected: Your account may be in sandbox mode. Verify your sending limits and that recipient emails are verified.'
      );
    });

    expect(defaultProps.onClose).not.toHaveBeenCalled();
    expect(sendButton).not.toBeDisabled();
  });
});
