import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Outlet } from 'react-router-dom';
import App from '@/App';

/**
 * The Layout mock is special: it must render an <Outlet /> component
 * from react-router-dom to ensure that nested routes are rendered correctly.
 */
vi.mock('@/components/Layout', () => ({
  default: () => (
    <div>
      <h1>Main Layout</h1>
      <Outlet />
    </div>
  ),
}));

vi.mock('@/pages/Index', () => ({ default: () => <div>Index Page</div> }));
vi.mock('@/pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('@/pages/NotFound', () => ({
  default: () => <div>Not Found Page</div>,
}));

vi.mock('@/components/email-template/EmailTemplateList', () => ({
  default: () => <div>Email Template List</div>,
}));
vi.mock('@/components/email-template/EmailTemplateForm', () => ({
  default: () => <div>Email Template Form</div>,
}));
vi.mock('@/components/contact-list/ListContactList', () => ({
  default: () => <div>Contact Lists</div>,
}));
vi.mock('@/components/contact-list/ContactListForm', () => ({
  default: () => <div>Contact List Form</div>,
}));

vi.mock('@/components/ui/toaster', () => ({ Toaster: () => null }));
vi.mock('@/components/ui/sonner', () => ({ Toaster: () => null }));

describe('App', () => {
  // Helper function to render the App component and navigate to a specific route.
  const renderAtRoute = (route: string) => {
    window.history.pushState({}, 'Test Page', route);
    render(<App />);
  };

  it('should render the home page for the root ("/") path', () => {
    renderAtRoute('/');
    // Check for text from both the Layout mock and the Index page mock
    expect(screen.getByText('Main Layout')).toBeInTheDocument();
    expect(screen.getByText('Index Page')).toBeInTheDocument();
  });

  it('should render the login page for the "/login" path', () => {
    renderAtRoute('/login');
    expect(screen.getByText('Main Layout')).toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render the "Not Found" page for a non-existent path', () => {
    renderAtRoute('/a/path/that/does/not/exist');
    expect(screen.getByText('Not Found Page')).toBeInTheDocument();
    // The Layout doesn't wrap the NotFound route, so it shouldn't be here.
    expect(screen.queryByText('Main Layout')).not.toBeInTheDocument();
  });

  it('should render the template list for the "/templates" path', () => {
    renderAtRoute('/templates');
    expect(screen.getByText('Main Layout')).toBeInTheDocument();
    expect(screen.getByText('Email Template List')).toBeInTheDocument();
  });

  it('should render the template form for the "/templates/edit" path with query params', () => {
    renderAtRoute('/templates/edit?id=some-template-id-123');
    expect(screen.getByText('Main Layout')).toBeInTheDocument();
    expect(screen.getByText('Email Template Form')).toBeInTheDocument();
  });

  it('should render the contact list form for the "/contact-lists/new" path', () => {
    renderAtRoute('/contact-lists/new');
    expect(screen.getByText('Main Layout')).toBeInTheDocument();
    expect(screen.getByText('Contact List Form')).toBeInTheDocument();
  });
});
