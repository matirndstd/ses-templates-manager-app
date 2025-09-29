import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import HtmlEditor from '@/components/email-template/HtmlEditor';

// Mock the Label component to simplify testing and focus on HtmlEditor logic
vi.mock('@/components/ui/label', () => ({
  Label: ({
    htmlFor,
    children,
  }: {
    htmlFor: string;
    children: React.ReactNode;
  }) => <label htmlFor={htmlFor}>{children}</label>,
}));

describe('HtmlEditor', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    error: undefined,
  };

  it('should render the label and code editor with a placeholder', () => {
    render(<HtmlEditor {...defaultProps} />);

    expect(screen.getByLabelText('HTML Content')).toBeInTheDocument();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', 'Your HTML content here');
  });

  it('should display the initial value provided in props', () => {
    const initialCode = '<h1>Hello World</h1>';
    render(<HtmlEditor {...defaultProps} value={initialCode} />);

    // The value should be present in the textarea
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(initialCode);
  });

  it('should call the onChange callback when the user types in the editor', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<HtmlEditor {...defaultProps} onChange={handleChange} />);

    const textarea = screen.getByRole('textbox');
    const typedText = '<div>New content</div>';

    await user.type(textarea, typedText);

    // The last call should contain the last typed character
    expect(handleChange).toHaveBeenLastCalledWith('>');
  });

  it('should display an error message and apply error styles when an error prop is provided', () => {
    const errorMessage = 'Invalid HTML syntax';
    render(<HtmlEditor {...defaultProps} error={errorMessage} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Find the container div of the editor to check its classes
    const editorWrapper =
      screen.getByRole('textbox').parentElement.parentElement;
    expect(editorWrapper).toBeInTheDocument();
    expect(editorWrapper).toHaveClass('border-destructive');
    expect(editorWrapper).not.toHaveClass('border-input');
  });

  it('should not display an error message or apply error styles when no error prop is provided', () => {
    render(<HtmlEditor {...defaultProps} />);

    // Ensure no error message is rendered
    expect(screen.getByLabelText('HTML Content')).toBeInTheDocument();

    // Check for the absence of the error class and presence of the default class
    const editorWrapper =
      screen.getByRole('textbox').parentElement.parentElement;
    expect(editorWrapper).not.toHaveClass('border-destructive');
    expect(editorWrapper).toHaveClass('border-input');
  });
});
