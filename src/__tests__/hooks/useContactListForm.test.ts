import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useContactListForm } from '@/hooks/useContactListForm';
import { useToast } from '@/components/ui/use-toast';
import {
  createContactList,
  getContactListByName,
  updateContactList,
} from '@/lib/aws-ses';
import type { ContactList } from '@/types';

// Mock dependencies
vi.mock('react-router-dom');
vi.mock('@/components/ui/use-toast');
vi.mock('@/lib/aws-ses');

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockDismiss = vi.fn();
const mockToasts = [];

const mockContactList: ContactList = {
  ContactListName: 'test-contact-list',
  Description: 'Test contact list description',
  Topics: [
    {
      TopicName: 'newsletter',
      DisplayName: 'Newsletter',
      Description: 'Weekly newsletter',
      DefaultSubscriptionStatus: 'OPT_IN',
    },
  ],
  Tags: [
    {
      Key: 'environment',
      Value: 'test',
    },
  ],
};

describe('useContactListForm', () => {
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
    it('should initialize with default values for new contact list', () => {
      const { result } = renderHook(() => useContactListForm({}));

      expect(result.current.isEditing).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.showDeleteDialog).toBe(false);
      expect(result.current.formData).toEqual({
        ContactListName: '',
        Description: '',
        Topics: [],
        Tags: [],
      });
      expect(result.current.errors).toEqual({});
    });

    it('should set isEditing to true when name is provided', () => {
      const { result } = renderHook(() =>
        useContactListForm({ name: 'test-list' })
      );

      expect(result.current.isEditing).toBe(true);
    });

    it('should redirect to home when not logged in', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      renderHook(() => useContactListForm({}));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Login Required',
          description: 'You need to log in to manage templates',
          variant: 'destructive',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should load contact list when editing and logged in', async () => {
      vi.mocked(getContactListByName).mockResolvedValue(mockContactList);

      const { result } = renderHook(() =>
        useContactListForm({ name: 'test-contact-list' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(getContactListByName).toHaveBeenCalledWith('test-contact-list');
      expect(result.current.formData).toEqual({
        ContactListName: mockContactList.ContactListName,
        Description: mockContactList.Description,
        Topics: mockContactList.Topics,
        Tags: mockContactList.Tags,
      });
    });

    it('should handle contact list not found error', async () => {
      vi.mocked(getContactListByName).mockResolvedValue(undefined);

      renderHook(() => useContactListForm({ name: 'non-existent' }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Contact list "non-existent" not found',
          variant: 'destructive',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/contact-lists');
      });
    });

    it('should handle contact list loading error', async () => {
      vi.mocked(getContactListByName).mockRejectedValue(
        new Error('Load failed')
      );

      renderHook(() => useContactListForm({ name: 'test-contact-list' }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to load "test-contact-list" contact list',
          variant: 'destructive',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/contact-lists');
      });
    });
  });

  describe('Form Handling', () => {
    it('should handle input changes', () => {
      const { result } = renderHook(() => useContactListForm({}));

      act(() => {
        result.current.handleChange({
          target: { name: 'ContactListName', value: 'new-contact-list' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.formData.ContactListName).toBe('new-contact-list');
    });

    it('should handle textarea changes', () => {
      const { result } = renderHook(() => useContactListForm({}));

      act(() => {
        result.current.handleChange({
          target: { name: 'Description', value: 'New description' },
        } as React.ChangeEvent<HTMLTextAreaElement>);
      });

      expect(result.current.formData.Description).toBe('New description');
    });

    it('should clear errors when field is changed', () => {
      const { result } = renderHook(() => useContactListForm({}));

      // Set initial error by triggering validation
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors.ContactListName).toBeTruthy();

      // Change field should clear error
      act(() => {
        result.current.handleChange({
          target: { name: 'ContactListName', value: 'new-contact-list' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.errors.ContactListName).toBe('');
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      ContactListName: 'test-contact-list',
      Description: 'Test description',
      Topics: [],
      Tags: [],
    };

    it('should create new contact list successfully', async () => {
      const createResponse = { ContactListName: 'test-contact-list' };
      vi.mocked(createContactList).mockResolvedValue(createResponse);

      const { result } = renderHook(() => useContactListForm({}));

      // Set valid form data
      act(() => {
        Object.entries(validFormData).forEach(([key, value]) => {
          result.current.handleChange({
            target: { name: key, value },
          } as React.ChangeEvent<HTMLInputElement>);
        });
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(createContactList).toHaveBeenCalledWith(
        expect.objectContaining({
          ContactListName: validFormData.ContactListName,
          Description: validFormData.Description,
        })
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: `Contact list "${validFormData.ContactListName}" has been created`,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/contact-lists');
    });

    it('should update existing contact list successfully', async () => {
      vi.mocked(getContactListByName).mockResolvedValue(mockContactList);
      vi.mocked(updateContactList).mockResolvedValue(mockContactList);

      const { result } = renderHook(() =>
        useContactListForm({ name: 'test-contact-list' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(updateContactList).toHaveBeenCalledWith(
        'test-contact-list',
        expect.any(Object)
      );
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: `Contact list "${mockContactList.ContactListName}" has been updated`,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/contact-lists');
    });

    it('should handle validation errors', async () => {
      const { result } = renderHook(() => useContactListForm({}));

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors.ContactListName).toBeTruthy();

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
    });

    it('should handle create contact list error', async () => {
      vi.mocked(createContactList).mockRejectedValue(
        new Error('Create failed')
      );

      const { result } = renderHook(() => useContactListForm({}));

      // Set valid form data
      act(() => {
        Object.entries(validFormData).forEach(([key, value]) => {
          result.current.handleChange({
            target: { name: key, value },
          } as React.ChangeEvent<HTMLInputElement>);
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

    it('should handle update contact list error', async () => {
      vi.mocked(getContactListByName).mockResolvedValue(mockContactList);
      vi.mocked(updateContactList).mockRejectedValue(
        new Error('Update failed')
      );

      const { result } = renderHook(() =>
        useContactListForm({ name: 'test-contact-list' })
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
      let resolveCreateContactList: (value: any) => void;
      const createContactListPromise = new Promise<any>((resolve) => {
        resolveCreateContactList = resolve;
      });

      vi.mocked(createContactList).mockReturnValue(createContactListPromise);

      const { result } = renderHook(() => useContactListForm({}));

      // Set valid form data
      act(() => {
        Object.entries(validFormData).forEach(([key, value]) => {
          result.current.handleChange({
            target: { name: key, value },
          } as React.ChangeEvent<HTMLInputElement>);
        });
      });

      // Start the submission (don't await yet)
      act(() => {
        result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      // Check that isSaving is true while the promise is pending
      expect(result.current.isSaving).toBe(true);

      // Now resolve the promise and wait for completion
      await act(async () => {
        resolveCreateContactList!({ ContactListName: 'test-contact-list' });
        await createContactListPromise;
      });

      // Check that isSaving is false after completion
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('Other Actions', () => {
    it('should handle delete action', () => {
      const { result } = renderHook(() => useContactListForm({}));

      act(() => {
        result.current.handleDelete();
      });

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should set delete dialog state', () => {
      const { result } = renderHook(() => useContactListForm({}));

      expect(result.current.showDeleteDialog).toBe(false);

      act(() => {
        result.current.setShowDeleteDialog(true);
      });

      expect(result.current.showDeleteDialog).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('should set loading state when fetching contact list', async () => {
      vi.mocked(getContactListByName).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockContactList), 100)
          )
      );

      const { result } = renderHook(() =>
        useContactListForm({ name: 'test-contact-list' })
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should set isLoggedIn based on localStorage', () => {
      const { result } = renderHook(() => useContactListForm({}));

      expect(result.current.isLoggedIn).toBe(true);
    });

    it('should set isLoggedIn to false when no credentials', () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const { result } = renderHook(() => useContactListForm({}));

      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  describe('Form Data Management', () => {
    it('should maintain Topics and Tags arrays', () => {
      const { result } = renderHook(() => useContactListForm({}));

      expect(result.current.formData.Topics).toEqual([]);
      expect(result.current.formData.Tags).toEqual([]);
    });

    it('should preserve loaded Topics and Tags', async () => {
      vi.mocked(getContactListByName).mockResolvedValue(mockContactList);

      const { result } = renderHook(() =>
        useContactListForm({ name: 'test-contact-list' })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.formData.Topics).toEqual(mockContactList.Topics);
      expect(result.current.formData.Tags).toEqual(mockContactList.Tags);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors for ContactListName', async () => {
      const { result } = renderHook(() => useContactListForm({}));

      // Set invalid ContactListName (empty)
      act(() => {
        result.current.handleChange({
          target: { name: 'ContactListName', value: '' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors.ContactListName).toBeTruthy();
    });

    it('should clear all errors on successful validation', async () => {
      const { result } = renderHook(() => useContactListForm({}));

      // First trigger validation errors
      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors.ContactListName).toBeTruthy();

      // Set valid data
      act(() => {
        result.current.handleChange({
          target: { name: 'ContactListName', value: 'valid-name' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      // Mock successful creation
      vi.mocked(createContactList).mockResolvedValue({
        ContactListName: 'valid-name',
      });

      await act(async () => {
        await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.errors).toEqual({});
    });
  });
});
