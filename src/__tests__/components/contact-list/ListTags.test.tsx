import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListTags from '@/components/contact-list/ListTags';
import { ContactList } from '@/types';

describe('ListTags', () => {
  const mockHandleChange = vi.fn();

  const initialTags: ContactList['Tags'] = [
    { Key: 'environment', Value: 'testing' },
    { Key: 'project', Value: '' },
  ];

  const renderComponent = () =>
    render(<ListTags tags={initialTags} handleChange={mockHandleChange} />);

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('renders all tags with key and value', () => {
    renderComponent();

    expect(screen.getByText('environment')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('project')).toBeInTheDocument();
    expect(screen.getByText("''")).toBeInTheDocument();
  });

  it('removes a tag when the delete button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const deleteButtons = screen.getAllByRole('button');
    expect(deleteButtons.length).toBe(2);

    await user.click(deleteButtons[0]); // remove the first tag

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    const event = mockHandleChange.mock.calls[0][0];
    expect(event.target.name).toBe('Tags');
    expect(event.target.value).toEqual([{ Key: 'project', Value: '' }]);
  });
});
