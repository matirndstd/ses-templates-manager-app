import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toast } from 'sonner';
import { listContactList } from '@/lib/aws-ses';
import ListContactList from '@/components/contact-list/ListContactList';
import { ContactList } from '@/types';

// Mock child components and external libraries
vi.mock('@/lib/aws-ses', () => ({
  listContactList: vi.fn(),
}));

vi.mock('@/components/contact-list/ContactListItem', () => ({
  default: ({ contactList }: { contactList: ContactList }) => (
    <div data-testid="contact-list-item">{contactList.ContactListName}</div>
  ),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
const mockListContactList = listContactList as unknown as ReturnType<
  typeof vi.fn
>;
const mockContactLists: ContactList[] = [
  {
    ContactListName: 'Newsletter Subscribers',
    LastUpdatedTimestamp: new Date(),
  },
  { ContactListName: 'Weekly Digest', LastUpdatedTimestamp: new Date() },
];

describe('ListContactList Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Wrapper component to provide routing context
  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={ui} />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render login prompt if user is not logged in', () => {
    renderWithRouter(<ListContactList />);

    expect(screen.getByText('Login Required')).toBeInTheDocument();
    expect(
      screen.getByText(/You need to log in with your AWS credentials/)
    ).toBeInTheDocument();

    const loginButton = screen.getByRole('button', {
      name: /Login with AWS Credentials/i,
    });
    expect(loginButton).toBeInTheDocument();

    // Check navigation on button click
    fireEvent.click(loginButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should display a loading skeleton while fetching data', () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));
    // Make the promise never resolve to keep it in a loading state
    mockListContactList.mockReturnValue(new Promise(() => {}));

    renderWithRouter(<ListContactList />);

    // The component uses `animate-pulse` for its skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    expect(
      screen.queryByText('Newsletter Subscribers')
    ).not.toBeInTheDocument();
  });

  it('should fetch and display contact lists when logged in', async () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));

    const listContactListMock =
      mockListContactList.mockResolvedValue(mockContactLists);

    renderWithRouter(<ListContactList />);

    // Wait for the loading to finish and the data to be displayed
    await waitFor(() => {
      expect(screen.getByText('Newsletter Subscribers')).toBeInTheDocument();
      expect(screen.getByText('Weekly Digest')).toBeInTheDocument();
    });

    expect(listContactListMock).toHaveBeenCalledOnce();
    // Check that the mock component was rendered for each item
    expect(screen.getAllByTestId('contact-list-item')).toHaveLength(2);
  });

  it('should display a "no contact list found" message if the API returns an empty array', async () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));
    mockListContactList.mockResolvedValue([]);

    renderWithRouter(<ListContactList />);

    await waitFor(() => {
      expect(screen.getByText('No contact list found')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first email template to get started')
      ).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully and show a toast', async () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));
    mockListContactList.mockRejectedValue(new Error('AWS API Error'));

    const toastErrorMock = vi.spyOn(toast, 'error');

    renderWithRouter(<ListContactList />);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Failed to load contact list from AWS SES'
      );
    });
  });

  it('should filter the contact lists when user types in the search input', async () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));
    mockListContactList.mockResolvedValueOnce(mockContactLists);

    renderWithRouter(<ListContactList />);

    await waitFor(() => {
      expect(screen.getByText('Newsletter Subscribers')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search contact list...');

    // Mock the response for the search query
    const filteredList = [mockContactLists[0]];
    const listContactListMock =
      mockListContactList.mockResolvedValueOnce(filteredList);

    // Simulate user typing a search term
    fireEvent.change(searchInput, { target: { value: 'Newsletter' } });

    // Wait for the component to re-render with filtered results
    await waitFor(() => {
      expect(listContactListMock).toHaveBeenCalledWith('Newsletter');
      expect(screen.getByText('Newsletter Subscribers')).toBeInTheDocument();
      expect(screen.queryByText('Weekly Digest')).not.toBeInTheDocument();
    });
  });

  it('display message when filter does not match any contact lists', async () => {
    localStorage.setItem('awsCredentials', JSON.stringify({}));

    renderWithRouter(<ListContactList />);

    const searchInput = screen.getByPlaceholderText('Search contact list...');

    mockListContactList.mockResolvedValueOnce([]);
    fireEvent.change(searchInput, {
      target: { value: 'Non-existent template' },
    });

    await waitFor(() => {
      expect(
        screen.getByText('No contact list match your search criteria')
      ).toBeInTheDocument();
    });
  });
});
