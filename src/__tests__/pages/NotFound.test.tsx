// NotFound.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

describe('NotFound', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    // .mockImplementation(() => {}) prevents the error from being printed to the test output.
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render the 404 error page content', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /page not found/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sorry, we couldn’t find the page you’re looking for/i)
    ).toBeInTheDocument();

    const homeLink = screen.getByRole('link', { name: /go back home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should log an error to the console with the current path', () => {
    const badRoute = '/some/non-existent/page';

    render(
      <MemoryRouter initialEntries={[badRoute]}>
        <NotFound />
      </MemoryRouter>
    );

    expect(consoleErrorSpy).toHaveBeenCalledOnce();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      badRoute
    );
  });
});
