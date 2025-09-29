import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});

describe('useIsMobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should return false initially when window width is above mobile breakpoint', () => {
      // Set window width to desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should return true initially when window width is below mobile breakpoint', () => {
      // Set window width to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should return true when window width equals mobile breakpoint - 1', () => {
      // Set window width to exactly mobile breakpoint - 1 (767px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should return false when window width equals mobile breakpoint', () => {
      // Set window width to exactly mobile breakpoint (768px)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe('Media Query Setup', () => {
    it('should create media query with correct breakpoint', () => {
      renderHook(() => useIsMobile());

      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });

    it('should add event listener for media query changes', () => {
      renderHook(() => useIsMobile());

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });

    it('should remove event listener on cleanup', () => {
      const { unmount } = renderHook(() => useIsMobile());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('Responsive Behavior', () => {
    it('should update when window is resized from desktop to mobile', () => {
      // Start with desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);

      // Simulate resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 500,
        });

        // Get the onChange callback that was registered
        const onChangeCallback = mockAddEventListener.mock.calls[0][1];
        onChangeCallback();
      });

      expect(result.current).toBe(true);
    });

    it('should update when window is resized from mobile to desktop', () => {
      // Start with mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);

      // Simulate resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        });

        // Get the onChange callback that was registered
        const onChangeCallback = mockAddEventListener.mock.calls[0][1];
        onChangeCallback();
      });

      expect(result.current).toBe(false);
    });

    it('should handle multiple resize events', () => {
      // Start with desktop size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);

      // Get the onChange callback
      const onChangeCallback = mockAddEventListener.mock.calls[0][1];

      // Resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 400,
        });
        onChangeCallback();
      });

      expect(result.current).toBe(true);

      // Resize back to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1200,
        });
        onChangeCallback();
      });

      expect(result.current).toBe(false);

      // Resize to tablet (still mobile)
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 600,
        });
        onChangeCallback();
      });

      expect(result.current).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle window width of 0', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should handle very large window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 9999,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should handle boundary values correctly', () => {
      // Test 766px (mobile)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 766,
      });

      let { result, unmount } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
      unmount();

      // Test 767px (mobile)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      ({ result, unmount } = renderHook(() => useIsMobile()));
      expect(result.current).toBe(true);
      unmount();

      // Test 768px (desktop)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      ({ result, unmount } = renderHook(() => useIsMobile()));
      expect(result.current).toBe(false);
      unmount();

      // Test 769px (desktop)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 769,
      });

      ({ result } = renderHook(() => useIsMobile()));
      expect(result.current).toBe(false);
    });
  });

  describe('Boolean Conversion', () => {
    it('should always return a boolean value', () => {
      const { result } = renderHook(() => useIsMobile());

      expect(typeof result.current).toBe('boolean');
    });

    it('should handle undefined initial state correctly', () => {
      // The hook starts with undefined but should return a boolean due to !!isMobile
      const { result } = renderHook(() => useIsMobile());

      // Should be boolean, not undefined
      expect(typeof result.current).toBe('boolean');
      expect(result.current).not.toBeUndefined();
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should work correctly with multiple hook instances', () => {
      // Set mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result: result1 } = renderHook(() => useIsMobile());
      const { result: result2 } = renderHook(() => useIsMobile());

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);

      // Both should update when window resizes
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1024,
        });

        // Trigger both callbacks (each hook registers its own listener)
        const callbacks = mockAddEventListener.mock.calls.map(
          (call) => call[1]
        );
        callbacks.forEach((callback) => callback());
      });

      expect(result1.current).toBe(false);
      expect(result2.current).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should not cause memory leaks when unmounted', () => {
      const { unmount } = renderHook(() => useIsMobile());

      // Verify event listener was added
      expect(mockAddEventListener).toHaveBeenCalledTimes(1);

      unmount();

      // Verify event listener was removed
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'change',
        mockAddEventListener.mock.calls[0][1]
      );
    });

    it('should handle multiple mount/unmount cycles', () => {
      const { unmount: unmount1 } = renderHook(() => useIsMobile());
      const { unmount: unmount2 } = renderHook(() => useIsMobile());

      expect(mockAddEventListener).toHaveBeenCalledTimes(2);

      unmount1();
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);

      unmount2();
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Media Query Integration', () => {
    it('should use the same callback function for add and remove event listener', () => {
      const { unmount } = renderHook(() => useIsMobile());

      const addedCallback = mockAddEventListener.mock.calls[0][1];

      unmount();

      const removedCallback = mockRemoveEventListener.mock.calls[0][1];

      expect(addedCallback).toBe(removedCallback);
    });

    it('should call matchMedia with exact breakpoint calculation', () => {
      renderHook(() => useIsMobile());

      // MOBILE_BREAKPOINT is 768, so media query should be (max-width: 767px)
      expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)');
    });
  });
});
