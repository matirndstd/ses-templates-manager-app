import { vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteTemplateDialog from '@/components/email-template/DeleteTemplateDialog';
import { deleteTemplate } from '@/lib/aws-s3';

// Mock toast
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock deleteTemplate
vi.mock('@/lib/aws-s3', () => ({
  deleteTemplate: vi.fn(),
}));

describe('DeleteTemplateDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnDeleted = vi.fn();
  const mockTemplateId = 'template-123';
  const mockTemplateName = 'Test Template';

  const renderComponent = (propsOverride = {}) => {
    return render(
      <DeleteTemplateDialog
        isOpen={true}
        templateId={mockTemplateId}
        templateName={mockTemplateName}
        onClose={mockOnClose}
        onDeleted={mockOnDeleted}
        {...propsOverride}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog with correct title and description', () => {
    renderComponent();
    expect(screen.getByText('Delete Template')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete the template/i)
    ).toBeInTheDocument();
    expect(screen.getByText('"Test Template"')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls deleteTemplate, toast, onDeleted and onClose on successful delete', async () => {
    const mockDelete = deleteTemplate as unknown as ReturnType<
      typeof vi.fn
    >;
    mockDelete.mockResolvedValueOnce(undefined);

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(mockTemplateId);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: `Template "${mockTemplateName}" has been deleted.`,
      });
      expect(mockOnDeleted).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error toast if deleteTemplate fails', async () => {
    const mockDelete = deleteTemplate as unknown as ReturnType<
      typeof vi.fn
    >;
    mockDelete.mockRejectedValueOnce(new Error('Failed'));

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(mockTemplateId);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to delete the template. Please try again.',
        variant: 'destructive',
      });
    });

    expect(mockOnDeleted).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
