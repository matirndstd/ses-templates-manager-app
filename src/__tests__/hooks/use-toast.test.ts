import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '@/hooks/use-toast';

// Mock setTimeout and clearTimeout for testing timeouts
vi.useFakeTimers();

// Helper function to reset the global state
const resetToastState = () => {
  // Create a temporary hook instance to access and clear the state
  const { result, unmount } = renderHook(() => useToast());
  
  // Always try to clear state, regardless of current length
  act(() => {
    result.current.dismiss(); // Dismiss all toasts
  });
  
  // Fast forward to remove all dismissed toasts
  act(() => {
    vi.advanceTimersByTime(1000001); // Slightly more than TOAST_REMOVE_DELAY
  });
  
  // Verify the state is actually clean
  const finalLength = result.current.toasts.length;
  
  // Clean up the temporary hook
  unmount();
  
  // If state is still not clean, we might need to force it
  if (finalLength > 0) {
    console.warn(`Toast state not fully cleaned: ${finalLength} toasts remaining`);
  }
};

describe('use-toast', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    resetToastState();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    resetToastState();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe('reducer', () => {
    const initialState = { toasts: [] };

    describe('ADD_TOAST', () => {
      it('should add a toast to empty state', () => {
        const toast = {
          id: '1',
          title: 'Test Toast',
          description: 'Test Description',
        };

        const action = {
          type: 'ADD_TOAST' as const,
          toast,
        };

        const newState = reducer(initialState, action);

        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0]).toEqual(toast);
      });

      it('should add toast to beginning of array', () => {
        const existingToast = {
          id: '1',
          title: 'Existing Toast',
        };

        const stateWithToast = { toasts: [existingToast] };

        const newToast = {
          id: '2',
          title: 'New Toast',
        };

        const action = {
          type: 'ADD_TOAST' as const,
          toast: newToast,
        };

        const newState = reducer(stateWithToast, action);

        expect(newState.toasts).toHaveLength(1); // Limited to 1 toast
        expect(newState.toasts[0]).toEqual(newToast);
      });

      it('should respect TOAST_LIMIT', () => {
        const existingToasts = [
          { id: '1', title: 'Toast 1' },
          { id: '2', title: 'Toast 2' },
        ];

        const stateWithToasts = { toasts: existingToasts };

        const newToast = {
          id: '3',
          title: 'New Toast',
        };

        const action = {
          type: 'ADD_TOAST' as const,
          toast: newToast,
        };

        const newState = reducer(stateWithToasts, action);

        expect(newState.toasts).toHaveLength(1); // TOAST_LIMIT is 1
        expect(newState.toasts[0]).toEqual(newToast);
      });
    });

    describe('UPDATE_TOAST', () => {
      it('should update existing toast', () => {
        const existingToast = {
          id: '1',
          title: 'Original Title',
          description: 'Original Description',
        };

        const stateWithToast = { toasts: [existingToast] };

        const action = {
          type: 'UPDATE_TOAST' as const,
          toast: {
            id: '1',
            title: 'Updated Title',
          },
        };

        const newState = reducer(stateWithToast, action);

        expect(newState.toasts[0]).toEqual({
          id: '1',
          title: 'Updated Title',
          description: 'Original Description',
        });
      });

      it('should not update non-matching toast', () => {
        const existingToast = {
          id: '1',
          title: 'Original Title',
        };

        const stateWithToast = { toasts: [existingToast] };

        const action = {
          type: 'UPDATE_TOAST' as const,
          toast: {
            id: '2',
            title: 'Updated Title',
          },
        };

        const newState = reducer(stateWithToast, action);

        expect(newState.toasts[0]).toEqual(existingToast);
      });
    });

    describe('DISMISS_TOAST', () => {
      it('should dismiss specific toast', () => {
        const toast1 = { id: '1', title: 'Toast 1', open: true };
        const toast2 = { id: '2', title: 'Toast 2', open: true };

        const stateWithToasts = { toasts: [toast1, toast2] };

        const action = {
          type: 'DISMISS_TOAST' as const,
          toastId: '1',
        };

        const newState = reducer(stateWithToasts, action);

        expect(newState.toasts[0].open).toBe(false);
        expect(newState.toasts[1].open).toBe(true);
      });

      it('should dismiss all toasts when no toastId provided', () => {
        const toast1 = { id: '1', title: 'Toast 1', open: true };
        const toast2 = { id: '2', title: 'Toast 2', open: true };

        const stateWithToasts = { toasts: [toast1, toast2] };

        const action = {
          type: 'DISMISS_TOAST' as const,
        };

        const newState = reducer(stateWithToasts, action);

        expect(newState.toasts[0].open).toBe(false);
        expect(newState.toasts[1].open).toBe(false);
      });
    });

    describe('REMOVE_TOAST', () => {
      it('should remove specific toast', () => {
        const toast1 = { id: '1', title: 'Toast 1' };
        const toast2 = { id: '2', title: 'Toast 2' };

        const stateWithToasts = { toasts: [toast1, toast2] };

        const action = {
          type: 'REMOVE_TOAST' as const,
          toastId: '1',
        };

        const newState = reducer(stateWithToasts, action);

        expect(newState.toasts).toHaveLength(1);
        expect(newState.toasts[0]).toEqual(toast2);
      });

      it('should remove all toasts when no toastId provided', () => {
        const toast1 = { id: '1', title: 'Toast 1' };
        const toast2 = { id: '2', title: 'Toast 2' };

        const stateWithToasts = { toasts: [toast1, toast2] };

        const action = {
          type: 'REMOVE_TOAST' as const,
        };

        const newState = reducer(stateWithToasts, action);

        expect(newState.toasts).toHaveLength(0);
      });
    });
  });

  describe('toast function', () => {
    it('should create a toast with generated id', () => {
      const result = toast({
        title: 'Test Toast',
        description: 'Test Description',
      });

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe('string');
      expect(result.dismiss).toBeInstanceOf(Function);
      expect(result.update).toBeInstanceOf(Function);
    });

    it('should generate unique ids', () => {
      const toast1 = toast({ title: 'Toast 1' });
      const toast2 = toast({ title: 'Toast 2' });

      expect(toast1.id).not.toBe(toast2.id);
    });

    it('should return update function that works', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        const toastResult = toast({
          title: 'Original Title',
          description: 'Original Description',
        });

        // Update the toast
        toastResult.update({
          id: toastResult.id,
          title: 'Updated Title',
          description: 'Original Description',
        });
      });

      expect(result.current.toasts[0].title).toBe('Updated Title');
    });

    it('should return dismiss function that works', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        const toastResult = toast({
          title: 'Test Toast',
        });

        // Dismiss the toast
        toastResult.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });
  });

  describe('useToast hook', () => {
    it('should return initial empty state', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
      expect(result.current.toast).toBeInstanceOf(Function);
      expect(result.current.dismiss).toBeInstanceOf(Function);
    });

    it('should add toast when toast function is called', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
          description: 'Test Description',
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Test Toast');
      expect(result.current.toasts[0].description).toBe('Test Description');
      expect(result.current.toasts[0].open).toBe(true);
    });

    it('should dismiss toast when dismiss is called', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;

      act(() => {
        const toastResult = result.current.toast({
          title: 'Test Toast',
        });
        toastId = toastResult.id;
      });

      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        result.current.dismiss(toastId);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should dismiss all toasts when dismiss is called without id', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Toast 1' });
        result.current.toast({ title: 'Toast 2' });
      });

      // Only one toast due to TOAST_LIMIT = 1
      expect(result.current.toasts[0].open).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should handle onOpenChange callback', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Test Toast',
        });
      });

      const toast = result.current.toasts[0];
      expect(toast.onOpenChange).toBeInstanceOf(Function);

      act(() => {
        toast.onOpenChange?.(false);
      });

      expect(result.current.toasts[0].open).toBe(false);
    });

    it('should automatically remove dismissed toasts after delay', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        const toastResult = result.current.toast({
          title: 'Test Toast',
        });
        result.current.dismiss(toastResult.id);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].open).toBe(false);

      // Fast-forward time to trigger removal
      act(() => {
        vi.advanceTimersByTime(1000000); // TOAST_REMOVE_DELAY
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should handle multiple hook instances sharing state', () => {
      const { result: result1 } = renderHook(() => useToast());
      const { result: result2 } = renderHook(() => useToast());

      act(() => {
        result1.current.toast({
          title: 'Test Toast',
        });
      });

      // Both hooks should see the same toast
      expect(result1.current.toasts).toHaveLength(1);
      expect(result2.current.toasts).toHaveLength(1);
      expect(result1.current.toasts[0].title).toBe('Test Toast');
      expect(result2.current.toasts[0].title).toBe('Test Toast');
    });

    it('should clean up listeners on unmount', () => {
      const { result, unmount } = renderHook(() => useToast());

      act(() => {
        result.current.toast({ title: 'Test Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Unmount should not cause errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Toast variants and props', () => {
    it('should handle different toast variants', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Success Toast',
          variant: 'default',
        });
      });

      expect(result.current.toasts[0].variant).toBe('default');
    });

    it('should handle destructive variant', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'Error Toast',
          variant: 'destructive',
        });
      });

      expect(result.current.toasts[0].variant).toBe('destructive');
    });

    it('should handle toast with action', () => {
      const { result } = renderHook(() => useToast());
      const mockAction = { altText: 'Undo' } as any;

      act(() => {
        result.current.toast({
          title: 'Toast with Action',
          action: mockAction,
        });
      });

      expect(result.current.toasts[0].action).toBe(mockAction);
    });

    it('should handle React node as title and description', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.toast({
          title: 'String Title',
          description: 'String Description',
        });
      });

      expect(result.current.toasts[0].title).toBe('String Title');
      expect(result.current.toasts[0].description).toBe('String Description');
    });
  });

  describe('Edge cases', () => {
    it('should handle rapid toast creation', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.toast({ title: `Toast ${i}` });
        }
      });

      // Should only keep the last toast due to TOAST_LIMIT = 1
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 4');
    });

    it('should handle dismissing non-existent toast', () => {
      const { result } = renderHook(() => useToast());

      // Clear any existing toasts first
      act(() => {
        result.current.dismiss();
      });
      
      act(() => {
        vi.advanceTimersByTime(1000001);
      });

      // Now verify we start with clean state
      expect(result.current.toasts).toHaveLength(0);

      expect(() => {
        act(() => {
          result.current.dismiss('non-existent-id');
        });
      }).not.toThrow();

      expect(result.current.toasts).toHaveLength(0);
    });
  });
});
