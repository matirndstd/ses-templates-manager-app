import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopicForm from '@/components/contact-list/TopicForm';
import { ContactList } from '@/types';

const mockHandleChange = vi.fn();

const renderComponent = (topics = []) =>
  render(<TopicForm topics={topics} handleChange={mockHandleChange} />);

describe('TopicForm', () => {
  beforeEach(() => {
    mockHandleChange.mockClear();
  });

  it('renders inputs and add button should be disabled', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('Topic Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Display Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add topic/i })).toBeDisabled();
  });

  it('enables Add Topic button when required fields are filled', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('Topic Name'), 'news');
    await user.type(screen.getByPlaceholderText('Display Name'), 'News');

    expect(
      screen.getByRole('button', { name: /add topic/i })
    ).not.toBeDisabled();
  });

  it('adds a topic when input is valid and not duplicate', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('Topic Name'), 'events');
    await user.type(screen.getByPlaceholderText('Display Name'), 'Events');
    await user.type(
      screen.getByPlaceholderText('Description'),
      'Event updates'
    );
    await user.click(screen.getByRole('button', { name: /add topic/i }));

    expect(mockHandleChange).toHaveBeenCalledTimes(1);
    const event = mockHandleChange.mock.calls[0][0];
    expect(event.target.name).toBe('Topics');
    expect(event.target.value[0].TopicName).toBe('events');
  });

  it('shows error if topic name is duplicate', async () => {
    const user = userEvent.setup();
    const topics: ContactList['Topics'] = [
      {
        TopicName: 'updates',
        DisplayName: 'Updates',
        Description: 'Monthly updates',
        DefaultSubscriptionStatus: 'OPT_IN',
      },
    ];
    renderComponent(topics);

    await user.type(screen.getByPlaceholderText('Topic Name'), 'updates');
    await user.type(screen.getByPlaceholderText('Display Name'), 'duplicate');
    await user.click(screen.getByRole('button', { name: /add topic/i }));

    expect(mockHandleChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Topic with name "updates" already exists./i)
    ).toBeInTheDocument();
  });

  it('show error if topic name has more than 64 characters', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('Topic Name'), 'a'.repeat(65));
    await user.type(screen.getByPlaceholderText('Display Name'), 'test');
    await user.click(screen.getByRole('button', { name: /add topic/i }));

    expect(mockHandleChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Topic name must be at most 64 characters./i)
    ).toBeInTheDocument();
  });

  it('show error if display name has more than 256 characters', async () => { // 4
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText('Topic Name'), 'test');
    await user.type(screen.getByPlaceholderText('Display Name'), 'a'.repeat(257));
    await user.click(screen.getByRole('button', { name: /add topic/i }));

    expect(mockHandleChange).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Display name must be at most 256 characters./i)
    ).toBeInTheDocument();
  });
});
