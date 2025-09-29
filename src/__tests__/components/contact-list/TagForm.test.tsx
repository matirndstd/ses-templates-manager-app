import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TagForm from '@/components/contact-list/TagForm';
import userEvent from '@testing-library/user-event';
import { ContactList } from '@/types';

const mockHandleChange = vi.fn();

const renderComponent = (tags = []) =>
  render(<TagForm tags={tags} handleChange={mockHandleChange} />);

describe('TagForm', () => {
  it('renders inputs and add button should be disabled', () => {
    renderComponent();

    expect(screen.getByPlaceholderText(/key/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/value/i)).toBeInTheDocument();
    const addButton = screen.getByRole('button', { name: /add/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it('allows typing into input fields', async () => {
    const user = userEvent.setup();
    renderComponent();

    const keyInput = screen.getByPlaceholderText(/key/i);
    const valueInput = screen.getByPlaceholderText(/value/i);

    await user.type(keyInput, 'Department');
    await user.type(valueInput, 'Engineering');

    expect(keyInput).toHaveValue('Department');
    expect(valueInput).toHaveValue('Engineering');
  });

  it('display already key exist error on submit', async () => {
    const user = userEvent.setup();
    const tags: ContactList['Tags'] = [
      {
        Key: 'environment',
        Value: 'production',
      },
    ];
    renderComponent(tags);

    await user.type(screen.getByPlaceholderText(/key/i), 'environment');
    await user.type(screen.getByPlaceholderText(/value/i), 'testing');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(mockHandleChange).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/Tag with key "environment" already exists./i)
    ).toBeInTheDocument();
  });

  it('display error if key name has more than 128 characters', async () => {
    const user = userEvent.setup();
    renderComponent();

    const repeatedWord = 'environment-repeated-key'.repeat(6);
    await user.type(screen.getByPlaceholderText(/key/i), repeatedWord);
    await user.type(screen.getByPlaceholderText(/value/i), 'testing');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(mockHandleChange).not.toHaveBeenCalled();
    expect(
      await screen.findByText(/Tag key must be at most 128 characters./i)
    ).toBeInTheDocument();
  });

  it('calls handleChange and clear inputs after a successful insert', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByPlaceholderText(/key/i), 'environment');
    await user.type(screen.getByPlaceholderText(/value/i), 'testing');
    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(mockHandleChange).toHaveBeenCalledWith({
      target: {
        name: 'Tags',
        value: [{ Key: 'environment', Value: 'testing' }],
      },
    });

    expect(screen.getByPlaceholderText(/key/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/value/i)).toHaveValue('');
  });

  it('calls handleChange after user presses Enter into key input', async () => {
    const user = userEvent.setup();
    renderComponent();

    const keyInput = screen.getByPlaceholderText(/key/i);
    await user.type(keyInput, 'environment');
    await user.type(screen.getByPlaceholderText(/value/i), 'testing');
    fireEvent.keyDown(keyInput, { key: 'Enter' });

    expect(mockHandleChange).toHaveBeenCalledWith({
      target: {
        name: 'Tags',
        value: [{ Key: 'environment', Value: 'testing' }],
      },
    });

    expect(screen.getByPlaceholderText(/key/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/value/i)).toHaveValue('');
  });

  it('calls handleChange after user presses Enter into value input', async () => {
    const user = userEvent.setup();
    renderComponent();

    const valueInput = screen.getByPlaceholderText(/value/i);
    await user.type(screen.getByPlaceholderText(/key/i), 'environment');
    await user.type(valueInput, 'testing');
    fireEvent.keyDown(valueInput, { key: 'Enter' });

    expect(mockHandleChange).toHaveBeenCalledWith({
      target: {
        name: 'Tags',
        value: [{ Key: 'environment', Value: 'testing' }],
      },
    });

    expect(screen.getByPlaceholderText(/key/i)).toHaveValue('');
    expect(screen.getByPlaceholderText(/value/i)).toHaveValue('');
  });
});
