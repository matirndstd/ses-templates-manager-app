import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailTemplateForm from '@/components/email-template/EmailTemplateForm';
import { useTemplateForm } from '@/hooks/useTemplateForm';

// Mock the dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams('id=template-id')],
  useNavigate: () => mockNavigate,
}));

vi.mock('@/hooks/useTemplateForm');
vi.mock(import('@/lib/utils'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
  };
});

// Mock the child components to simplify testing
vi.mock('@/components/email-template/DeleteTemplateDialog', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div>DeleteTemplateDialog</div> : null,
}));
vi.mock('@/components/email-template/EmailPreview', () => ({
  default: () => <div>EmailPreview</div>,
}));
vi.mock('@/components/email-template/TemplateDetailsForm', () => ({
  default: () => <div>TemplateDetailsForm</div>,
}));
vi.mock('@/components/TemplateFormSkeleton', () => ({
  default: () => <div>TemplateFormSkeleton</div>,
}));

describe('EmailTemplateForm', () => {
  // Define a base state that we can override in specific tests
  const baseMockHookValues = {
    isEditing: false,
    isLoading: false,
    isSaving: false,
    isLoggedIn: true,
    formData: {},
    errors: {},
    showDeleteDialog: false,
    showPreview: true,
    tab: 'editor',
    setShowDeleteDialog: vi.fn(),
    togglePreview: vi.fn(),
    handleChange: vi.fn(),
    handleHtmlChange: vi.fn(),
    handleSubmit: vi.fn((e) => e.preventDefault()), // Prevent form submission in tests
    handleDelete: vi.fn(),
    navigate: mockNavigate,
    setTab: vi.fn(),
  };

  beforeEach(() => {
    (useTemplateForm as ReturnType<typeof vi.fn>).mockReturnValue(
      baseMockHookValues
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render the skeleton when loading', () => {
    (useTemplateForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isLoading: true,
    });

    render(<EmailTemplateForm />);
    expect(screen.getByText('TemplateFormSkeleton')).toBeInTheDocument();
  });

  it('should render nothing if the user is not logged in', () => {
    (useTemplateForm as ReturnType<typeof vi.fn>).mockReturnValue({
      ...baseMockHookValues,
      isLoggedIn: false,
    });

    const { container } = render(<EmailTemplateForm />);
    expect(container.firstChild).toBeNull();
  });

  it('should call navigate when the back or cancel buttons are clicked', () => {
    render(<EmailTemplateForm />);

    const backButton = screen.getAllByRole('button')[0];
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith('/templates');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(mockNavigate).toHaveBeenCalledWith('/templates');
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      (useTemplateForm as ReturnType<typeof vi.fn>).mockReturnValue({
        ...baseMockHookValues,
        formData: {
          TemplateName: 'Test Template',
          Subject: 'Test Subject',
          Html: '<p>Test HTML</p>',
        },
      });
    });

    it('should render the create template form', () => {
      render(<EmailTemplateForm />);
      expect(screen.getByText('Create Template')).toBeInTheDocument();
      expect(screen.getByText('Save Template')).toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should call handleSubmit when the form is submitted', () => {
      render(<EmailTemplateForm />);

      expect(
        screen.getByRole('heading', { name: /create Template/i })
      ).toBeInTheDocument();
      // Ensure the delete button is NOT present in create mode
      expect(
        screen.queryByRole('button', { name: /delete/i })
      ).not.toBeInTheDocument();

      // Check that child components are rendered
      expect(screen.getByText('EmailPreview')).toBeInTheDocument();
      expect(
        screen.queryByText('DeleteTemplateDialog')
      ).not.toBeInTheDocument();

      const submitButton = screen.getByRole('button', {
        name: /save Template/i,
      });
      expect(submitButton).toBeInTheDocument();

      fireEvent.click(submitButton);
      expect(baseMockHookValues.handleSubmit).toHaveBeenCalled();
    });

    it('should disable buttons and show "Saving..." text when isSaving is true', () => {
      (useTemplateForm as ReturnType<typeof vi.fn>).mockReturnValue({
        ...baseMockHookValues,
        isSaving: true,
      });

      render(<EmailTemplateForm />);

      // The save button text changes and it becomes disabled
      const saveButton = screen.getByRole('button', { name: /saving\.\.\./i });
      expect(saveButton).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // The cancel button also becomes disabled
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      (useTemplateForm as ReturnType<typeof vi.fn>).mockReturnValue({
        ...baseMockHookValues,
        isEditing: true,
        formData: {
          TemplateName: 'Existing Template',
          Subject: 'Existing Subject',
          Html: '<p>Existing HTML</p>',
          dynamicFields: [],
        },
      });
    });

    it('should render the edit template form', () => {
      render(<EmailTemplateForm />);
      expect(screen.getByText('Edit Template')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should open the delete dialog', () => {
      render(<EmailTemplateForm />);
      fireEvent.click(screen.getByText('Delete'));
      expect(baseMockHookValues.setShowDeleteDialog).toHaveBeenCalledWith(true);
    });
  });
});
