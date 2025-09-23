import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListTopics from '@/components/contact-list/ListTopics';
import { ContactList } from '@/types';

describe('ListTopics', () => {
  const mockHandleChange = vi.fn();

  const topics: ContactList['Topics'] = [
    {
      TopicName: 'weekly-news',
      DisplayName: 'Weekly News',
      Description: 'A weekly newsletter',
      DefaultSubscriptionStatus: 'OPT_IN',
    },
    {
      TopicName: 'promotions',
      DisplayName: 'Promotions',
      Description: 'Promotional content',
      DefaultSubscriptionStatus: 'OPT_OUT',
    },
  ];

  const renderComponent = () =>
    render(<ListTopics topics={topics} handleChange={mockHandleChange} />);

  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('renders all topics with their fields', () => {
    renderComponent();

    expect(screen.getByText('weekly-news')).toBeInTheDocument();
    expect(screen.getByText('Weekly News')).toBeInTheDocument();
    expect(screen.getByText('A weekly newsletter')).toBeInTheDocument();
    expect(screen.getByText('OPT_IN')).toBeInTheDocument();

    expect(screen.getByText('promotions')).toBeInTheDocument();
    expect(screen.getByText('Promotions')).toBeInTheDocument();
    expect(screen.getByText('Promotional content')).toBeInTheDocument();
    expect(screen.getByText('OPT_OUT')).toBeInTheDocument();
  });

  it('removes a topic when Remove button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[1]); // remove the second topic

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    const event = mockHandleChange.mock.calls[0][0];
    expect(event.target.name).toBe('Topics');
    expect(event.target.value).toEqual([topics[0]]);
  });
});
