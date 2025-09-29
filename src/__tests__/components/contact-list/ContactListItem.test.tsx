import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactListItem from '@/components/contact-list/ContactListItem';
import { ContactList } from '@/types';
import userEvent from '@testing-library/user-event';

const mockContactList: ContactList = {
  ContactListName: 'Test List',
  Description: 'This is a test description',
  LastUpdatedTimestamp: new Date(),
};
const mockOnDeleted = vi.fn();

const renderComponent = () =>
  render(
    <MemoryRouter>
      <ContactListItem
        contactList={mockContactList}
        onDeleted={mockOnDeleted}
      />
    </MemoryRouter>
  );

describe('ContactListItem', () => {
  it('renders contact list name and description', () => {
    renderComponent();

    expect(screen.getByText('Test List')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders the formatted update date', () => {
    renderComponent();

    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('opens the dropdown menu', async () => {
    const user = userEvent.setup();

    renderComponent();

    const menuButton = screen.getByRole('button', { name: /open menu/i });

    await user.click(menuButton);

    expect(await screen.findByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('opens the delete alertdialog when delete is clicked', async () => {
    const user = userEvent.setup();

    renderComponent();

    const menuButton = screen.getByRole('button', { name: /open menu/i });

    await user.click(menuButton);
    await user.click(await screen.findByText('Delete'));

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
  });
});
