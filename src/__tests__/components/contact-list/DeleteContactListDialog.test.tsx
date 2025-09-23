import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeleteContactListDialog from '@/components/contact-list/DeleteContactListDialog';
import { deleteContactList } from '@/lib/aws-ses';

vi.mock('@/lib/aws-ses', () => ({
  deleteContactList: vi.fn(),
}));

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('lucide-react', () => ({
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />,
}));

describe('DeleteContactListDialog', () => {
  const defaultProps = {
    isOpen: true,
    contactListName: 'My Test List',
    onClose: vi.fn(),
    onDeleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the dialog with the correct content when open', () => {
    render(<DeleteContactListDialog {...defaultProps} />);

    expect(
      screen.getByRole('heading', { name: /delete contact list/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/are you sure you want to delete the contact list/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/"My Test List"/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call onClose when the cancel button is clicked', () => {
    render(<DeleteContactListDialog {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should handle successful deletion correctly', async () => {
    // Mock the API to resolve successfully
    const mockDeleteContactList = deleteContactList as unknown as ReturnType<
      typeof vi.fn
    >;
    mockDeleteContactList.mockResolvedValueOnce(undefined);

    render(<DeleteContactListDialog {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    // Check for loading state immediately after click
    expect(
      screen.getByRole('button', { name: /deleting\.\.\./i })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    // Wait for async operations to complete and check the final state
    await waitFor(() => {
      expect(mockDeleteContactList).toHaveBeenCalledWith('My Test List');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Contact list "My Test List" has been deleted.',
      });

      // Check if the callbacks were triggered
      expect(defaultProps.onDeleted).toHaveBeenCalledTimes(1);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle failed deletion correctly', async () => {
    // Mock the API to reject with an error
    const mockDeleteContactList = deleteContactList as unknown as ReturnType<
      typeof vi.fn
    >;
    mockDeleteContactList.mockRejectedValueOnce(new Error('API Error'));

    render(<DeleteContactListDialog {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(
      screen.getByRole('button', { name: /deleting\.\.\./i })
    ).toBeDisabled();

    await waitFor(() => {
      expect(mockDeleteContactList).toHaveBeenCalledWith('My Test List');

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to delete the contact list. Please try again.',
        variant: 'destructive',
      });
    });

    // Ensure success/close callbacks were NOT called and the dialog remains open
    expect(defaultProps.onDeleted).not.toHaveBeenCalled();
    expect(defaultProps.onClose).not.toHaveBeenCalled();

    // The delete button should be enabled again after the error
    expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled();
  });
});
