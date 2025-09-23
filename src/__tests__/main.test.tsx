import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/App.tsx', () => ({
  default: function App() {
    return <div>Mock App</div>;
  },
}));

const mockRender = vi.fn();
vi.mock('react-dom/client', async () => ({
  createRoot: vi.fn().mockImplementation((container) => {
    // If the container is null or undefined (falsy), throw an error.
    if (!container) {
      throw new Error('Target container is not a DOM element.');
    }
    // Otherwise, return the mock with the render function.
    return {
      render: mockRender,
    };
  }),
}));

describe('Application Entry Point (main.tsx)', () => {
  let rootElement: HTMLElement;

  beforeEach(() => {
    /**
     * This resets the module cache before each test, ensuring that the
     * side-effects in `main.tsx` are re-executed for every test case.
     */
    vi.resetModules();

    /**
     * Before each test, create a div with id="root" and append it to the
     * document body. This simulates the `index.html` file.
     */
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  });

  afterEach(() => {
    // Clean up mocks and the DOM after each test
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('should find the root element and render the App component into it', async () => {
    // Dynamically import the `main.tsx` module to execute its code.
    // This triggers the call to `createRoot(...).render(...)`.
    await import('@/main.tsx');

    // Get the mocked `createRoot` function from our imported module
    const { createRoot } = await import('react-dom/client');

    // Check that `createRoot` was called with our #root element.
    expect(createRoot).toHaveBeenCalledWith(rootElement);

    // Check that the `render` method was called exactly once.
    expect(mockRender).toHaveBeenCalledTimes(1);

    // Check that `render` was called with the <App /> component.
    // We inspect the first argument of the first call to `mockRender`.
    const renderArgument = mockRender.mock.calls[0][0];
    expect(renderArgument.type.name).toBe('App');
  });

  it('should throw an error if the root element is not found', async () => {
    document.body.removeChild(rootElement);

    // This test will now pass because our updated mock throws an error,
    // which causes the dynamic import promise to reject.
    const importPromise = import('@/main.tsx');
    await expect(importPromise).rejects.toThrow(
      'Target container is not a DOM element.'
    );
  });
});
