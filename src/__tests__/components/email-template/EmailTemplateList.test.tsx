import { describe, it, vi, beforeEach, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EmailTemplateList from '@/components/email-template/EmailTemplateList';
import { toast } from 'sonner';
import { listTemplates } from '@/lib/aws-ses';

vi.mock('@/lib/aws-ses', () => ({
  listTemplates: vi.fn(),
}));

vi.mock('@/components/ui/button', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock('@/components/ui/input', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Input: (props: any) => <input {...props} />,
}));
vi.mock('./EmailTemplateCard', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ template }: any) => <div>{template.TemplateName}</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
const mockListTemplates = listTemplates as unknown as ReturnType<typeof vi.fn>;

describe('EmailTemplateList', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <EmailTemplateList />
      </BrowserRouter>
    );

  it('renders login prompt when not logged in', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue(null),
    });

    renderComponent();

    expect(screen.getByText('Login Required')).toBeInTheDocument();
    expect(
      screen.getByText(/You need to log in with your AWS credentials/i)
    ).toBeInTheDocument();

    await user.click(screen.getByText(/Login with AWS Credentials/i));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('shows loading and then templates when logged in', async () => {
    const mockTemplates = [
      {
        id: '1',
        TemplateName: 'Test Template',
        Subject: '',
        Html: '',
        Text: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('{"accessKeyId":"test"}'),
    });

    mockListTemplates.mockResolvedValue(mockTemplates);

    renderComponent();

    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Template')).toBeInTheDocument();
    });
  });

  it('shows empty state when no templates are found', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('{"accessKeyId":"test"}'),
    });

    mockListTemplates.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
    });

    expect(screen.getByText(/Create Template/)).toBeInTheDocument();
  });

  it('calls listTemplates when typing in search', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('{"accessKeyId":"test"}'),
    });

    const listTemplatesMock = mockListTemplates.mockResolvedValue([]);

    renderComponent();

    const searchInput = screen.getByPlaceholderText('Search templates...');
    await user.type(searchInput, 'welcome');

    await waitFor(() => {
      expect(listTemplatesMock).toHaveBeenCalledWith('welcome');
    });
  });

  it('shows error toast if listTemplates fails', async () => {
    const toastErrorMock = vi.spyOn(toast, 'error');
    mockListTemplates.mockRejectedValue(new Error('Error fetching templates'));

    renderComponent();

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Failed to load templates from AWS SES'
      );
    });
  });
});
