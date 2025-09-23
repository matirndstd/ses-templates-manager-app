import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useTemplateForm } from '@/hooks/useTemplateForm';
import { useToast } from '@/components/ui/use-toast';
import { createTemplate, getTemplateById, updateTemplate } from '@/lib/aws-ses';
import type { EmailTemplate } from '@/types';

// Mock dependencies
vi.mock('react-router-dom');
vi.mock('@/components/ui/use-toast');
vi.mock('@/lib/aws-ses');

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockDismiss = vi.fn();
const mockToasts = [];

const mockTemplate: EmailTemplate = {
  id: 'test-template',
  TemplateName: 'test-template',
  Subject: 'Test Subject',
  Html: '<p>Test HTML</p>',
  Text: 'Test Text',
  dynamicFields: ['name', 'company'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('useTemplateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useNavigate
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);

    // Mock useToast
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      dismiss: mockDismiss,
      toasts: mockToasts,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify({ region: 'us-east-1' })),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default values for new template', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      expect(result.current.isEditing).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.showDeleteDialog).toBe(false);
      expect(result.current.showPreview).toBe(false);
      expect(result.current.tab).toBe('html');
      expect(result.current.formData).toEqual({
        TemplateName: '',
        Subject: '',
        Html: '',
        Text: '',
        dynamicFields: [],
      });
      expect(result.current.errors).toEqual({});
    });

    it('should set isEditing to true when id is provided', async () => {
      const { result } = renderHook(() => useTemplateForm({ id: 'test-id' }));

      await waitFor(() => {
        expect(result.current.isEditing).toBe(true);
      });
    });

    it('should redirect to home when not logged in', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      renderHook(() => useTemplateForm({}));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login Required',
          description: 'You need to log in to manage templates',
          variant: 'destructive',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should load template when editing and logged in', async () => {
      vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);

      const { result } = renderHook(() =>
        useTemplateForm({ id: 'test-template' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getTemplateById).toHaveBeenCalledWith('test-template');
      expect(result.current.formData).toEqual({
        TemplateName: mockTemplate.TemplateName,
        Subject: mockTemplate.Subject,
        Html: mockTemplate.Html,
        Text: mockTemplate.Text,
        dynamicFields: mockTemplate.dynamicFields,
      });
    });

    it('should handle template not found error', async () => {
      vi.mocked(getTemplateById).mockResolvedValue(undefined);

      renderHook(() => useTemplateForm({ id: 'non-existent' }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Template not found',
          variant: 'destructive',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should handle template loading error', async () => {
      vi.mocked(getTemplateById).mockRejectedValue(new Error('Load failed'));

      renderHook(() => useTemplateForm({ id: 'test-template' }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load template',
          variant: 'destructive',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Form Handling', () => {
    it('should handle input changes', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      act(() => {
        result.current.handleChange({
          target: { name: 'TemplateName', value: 'new-template' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.TemplateName).toBe('new-template');
    });

    it('should clear errors when field is changed', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      // Set initial error
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors.TemplateName).toBeTruthy();

      // Change field should clear error
      act(() => {
        result.current.handleChange({
          target: { name: 'TemplateName', value: 'new-template' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.TemplateName).toBe('');
    });

    it('should handle HTML changes', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      act(() => {
        result.current.handleHtmlChange('<p>New HTML</p>');
      });

      expect(result.current.formData.Html).toBe('<p>New HTML</p>');
    });

    it('should clear HTML errors when HTML is changed', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      // Trigger validation to set errors
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors.Html).toBeTruthy();

      // Change HTML should clear error
      act(() => {
        result.current.handleHtmlChange('<p>New HTML</p>');
      });

      expect(result.current.errors.Html).toBe('');
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      TemplateName: 'test-template',
      Subject: 'Test Subject',
      Html: '<p>Test HTML</p>',
      Text: 'Test Text',
      dynamicFields: [],
    };

    it('should create new template successfully', async () => {
      vi.mocked(createTemplate).mockResolvedValue(mockTemplate);

      const { result } = renderHook(() => useTemplateForm({}));

      // Set valid form data
      act(() => {
        Object.entries(validFormData).forEach(([key, value]) => {
          if (key === 'Html') {
            result.current.handleHtmlChange(value as string);
          } else {
            result.current.handleChange({
              target: { name: key, value },
            } as React.ChangeEvent<HTMLInputElement>);
          }
        });
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(createTemplate).toHaveBeenCalledWith(validFormData);
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: `Template "${validFormData.TemplateName}" has been created`,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/templates');
    });

    it('should update existing template successfully', async () => {
      vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);
      vi.mocked(updateTemplate).mockResolvedValue(mockTemplate);

      const { result } = renderHook(() =>
        useTemplateForm({ id: 'test-template' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(updateTemplate).toHaveBeenCalledWith(
        'test-template',
        expect.any(Object)
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: `Template "${mockTemplate.TemplateName}" has been updated`,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/templates');
    });

    it('should handle validation errors', async () => {
      const { result } = renderHook(() => useTemplateForm({}));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors.TemplateName).toBeTruthy();
      expect(result.current.errors.Subject).toBeTruthy();
      expect(result.current.errors.Html).toBeTruthy();
      expect(result.current.errors.Text).toBeTruthy();

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
    });

    it('should switch to html tab when Html has validation error', async () => {
      const { result } = renderHook(() => useTemplateForm({}));

      // Set tab to text initially
      act(() => {
        result.current.setTab('text');
      });

      // Set some valid data but leave Html empty
      act(() => {
        result.current.handleChange({
          target: { name: 'TemplateName', value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: 'Subject', value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: 'Text', value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.tab).toBe('html');
    });

    it('should switch to text tab when Text has validation error', async () => {
      const { result } = renderHook(() => useTemplateForm({}));

      // Set some valid data but leave Text empty
      act(() => {
        result.current.handleChange({
          target: { name: 'TemplateName', value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleChange({
          target: { name: 'Subject', value: 'test' },
        } as React.ChangeEvent<HTMLInputElement>);
        result.current.handleHtmlChange('<p>test</p>');
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.tab).toBe('text');
    });

    it('should handle create template error', async () => {
      vi.mocked(createTemplate).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useTemplateForm({}));

      // Set valid form data
      act(() => {
        Object.entries(validFormData).forEach(([key, value]) => {
          if (key === 'Html') {
            result.current.handleHtmlChange(value as string);
          } else {
            result.current.handleChange({
              target: { name: key, value },
            } as React.ChangeEvent<HTMLInputElement>);
          }
        });
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Create failed',
        variant: 'destructive',
      });
    });

    it('should handle update template error', async () => {
      vi.mocked(getTemplateById).mockResolvedValue(mockTemplate);
      vi.mocked(updateTemplate).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() =>
        useTemplateForm({ id: 'test-template' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Update failed',
        variant: 'destructive',
      });
    });

    it('should set isSaving state during submission', async () => {
      // Created a promise that we can manually resolve using resolveCreateTemplate
      let resolveCreateTemplate: (value: EmailTemplate) => void;
      const createTemplatePromise = new Promise<EmailTemplate>((resolve) => {
        resolveCreateTemplate = resolve;
      });

      vi.mocked(createTemplate).mockReturnValue(createTemplatePromise);

      const { result } = renderHook(() => useTemplateForm({}));

      // Set valid form data
      act(() => {
        Object.entries(validFormData).forEach(([key, value]) => {
          if (key === 'Html') {
            result.current.handleHtmlChange(value as string);
          } else {
            result.current.handleChange({
              target: { name: key, value },
            } as React.ChangeEvent<HTMLInputElement>);
          }
        });
      });

      // Start the submission
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      // Check that isSaving is true while the promise is pending
      expect(result.current.isSaving).toBe(true);

      // Now resolve the promise and wait for completion
      await act(async () => {
        resolveCreateTemplate!(mockTemplate);
        await createTemplatePromise;
      });

      // Check that isSaving is false after completion
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('Other Actions', () => {
    it('should handle delete action', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      act(() => {
        result.current.handleDelete();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should toggle preview', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      expect(result.current.showPreview).toBe(false);

      act(() => {
        result.current.togglePreview();
      });

      expect(result.current.showPreview).toBe(true);

      act(() => {
        result.current.togglePreview();
      });

      expect(result.current.showPreview).toBe(false);
    });

    it('should set delete dialog state', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      expect(result.current.showDeleteDialog).toBe(false);

      act(() => {
        result.current.setShowDeleteDialog(true);
      });

      expect(result.current.showDeleteDialog).toBe(true);
    });

    it('should set tab', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      expect(result.current.tab).toBe('html');

      act(() => {
        result.current.setTab('text');
      });

      expect(result.current.tab).toBe('text');
    });
  });

  describe('Loading States', () => {
    it('should set loading state when fetching template', async () => {
      vi.mocked(getTemplateById).mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(mockTemplate), 100))
      );

      const { result } = renderHook(() =>
        useTemplateForm({ id: 'test-template' })
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isLoggedIn based on localStorage', () => {
      const { result } = renderHook(() => useTemplateForm({}));

      expect(result.current.isLoggedIn).toBe(true);
    });

    it('should set isLoggedIn to false when no credentials', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const { result } = renderHook(() => useTemplateForm({}));

      expect(result.current.isLoggedIn).toBe(false);
    });
  });
});
