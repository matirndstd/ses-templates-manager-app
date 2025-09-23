import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ContactListForm from '@/components/contact-list/ContactListForm';
import { useContactListForm } from '@/hooks/useContactListForm';

vi.mock('@/hooks/useContactListForm');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ name: 'test-list' }),
  useNavigate: () => mockNavigate,
}));

// Mock child components for isolation
vi.mock('@/components/TemplateFormSkeleton', () => ({
  default: ({ title }: { title: string }) => <div>MockSkeleton: {title}</div>,
}));

vi.mock('@/components/contact-list/DeleteContactListDialog', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>MockDeleteDialog</div> : null,
}));

vi.mock('@/components/contact-list/ListTopics', () => ({
  default: () => <div>MockListTopics</div>,
}));
vi.mock('@/components/contact-list/TopicForm', () => ({
  default: () => <div>MockTopicForm</div>,
}));
vi.mock('@/components/contact-list/ListTags', () => ({
  default: () => <div>MockListTags</div>,
}));
vi.mock('@/components/contact-list/TagForm', () => ({
  default: () => <div>MockTagForm</div>,
}));

describe('ContactListForm', () => {
  const mockHandleChange = vi.fn();
  const mockHandleSubmit = vi.fn((e) => e.preventDefault());
  const mockHandleDelete = vi.fn();
  const mockSetShowDeleteDialog = vi.fn();

  // Define a base state that we can override in specific tests
  const baseMockHookValues = {
    isEditing: false,
    isLoading: false,
    isSaving: false,
    isLoggedIn: true,
    formData: {
      ContactListName: 'My Test List',
      Description: 'A description for the list.',
      Tags: [],
      Topics: [],
    },
    errors: {},
    showDeleteDialog: false,
    setShowDeleteDialog: mockSetShowDeleteDialog,
    handleChange: mockHandleChange,
    handleSubmit: mockHandleSubmit,
    handleDelete: mockHandleDelete,
    navigate: mockNavigate,
  };

  beforeEach(() => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue(
      baseMockHookValues
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render null if user is not logged in', () => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isLoggedIn: false,
    });
    const { container } = render(<ContactListForm />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the skeleton loader when loading', () => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isLoading: true,
    });
    render(<ContactListForm />);
    expect(
      screen.getByText('MockSkeleton: Loading contact lists')
    ).toBeInTheDocument();
  });

  it('should render the form in "Create" mode correctly', () => {
    render(<ContactListForm />);

    expect(
      screen.getByRole('heading', { name: /create contact list/i })
    ).toBeInTheDocument();

    // Check if form fields are rendered with correct values
    expect(screen.getByLabelText(/name/i)).toHaveValue(
      baseMockHookValues.formData.ContactListName
    );
    expect(screen.getByLabelText(/description/i)).toHaveValue(
      baseMockHookValues.formData.Description
    );

    // Ensure the delete button is NOT present in create mode
    expect(
      screen.queryByRole('button', { name: /delete/i })
    ).not.toBeInTheDocument();

    // Check that child components are rendered
    expect(screen.getByText('MockTagForm')).toBeInTheDocument();
    expect(screen.getByText('MockTopicForm')).toBeInTheDocument();
  });

  it('should render the form in "Edit" mode correctly', () => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isEditing: true,
    });
    render(<ContactListForm />);

    expect(
      screen.getByRole('heading', { name: /edit contact list/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('should call handleChange when user types in the name input', () => {
    render(<ContactListForm />);
    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'A new list name' } });
    expect(mockHandleChange).toHaveBeenCalled();
  });

  it('should call handleSubmit when the form is submitted', () => {
    render(<ContactListForm />);
    const saveButton = screen.getByRole('button', {
      name: /save contact list/i,
    });
    fireEvent.click(saveButton);
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it('should display validation errors when provided', () => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      errors: {
        ContactListName: 'Name cannot be empty.',
        Description: 'Description is required.',
      },
    });
    render(<ContactListForm />);
    expect(screen.getByText('Name cannot be empty.')).toBeInTheDocument();
    expect(screen.getByText('Description is required.')).toBeInTheDocument();
  });

  it('should disable buttons and show "Saving..." text when isSaving is true', () => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isSaving: true,
    });
    render(<ContactListForm />);

    // The save button text changes and it becomes disabled
    const saveButton = screen.getByRole('button', { name: /saving\.\.\./i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // The cancel button also becomes disabled
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('should call setShowDeleteDialog when delete button is clicked in edit mode', () => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isEditing: true,
    });
    render(<ContactListForm />);
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    expect(mockSetShowDeleteDialog).toHaveBeenCalledWith(true);
  });

  it('should render the DeleteContactListDialog when showDeleteDialog is true in edit mode', () => {
    (useContactListForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isEditing: true,
      showDeleteDialog: true,
    });
    render(<ContactListForm />);
    expect(screen.getByText('MockDeleteDialog')).toBeInTheDocument();
  });

  it('should call navigate when the back or cancel buttons are clicked', () => {
    render(<ContactListForm />);

    const backButton = screen.getAllByRole('button')[0]; // First button in the DOM
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/contact-lists');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(mockNavigate).toHaveBeenCalledWith('/contact-lists');

    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });
});
