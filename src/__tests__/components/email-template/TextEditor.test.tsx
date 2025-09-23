import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TextEditor from '@/components/email-template/TextEditor';

vi.mock('@/components/ui/label', () => ({
  Label: ({ htmlFor, children }) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props) => <textarea data-testid="textarea" {...props} />,
}));

describe('TextEditor', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    generateContent: vi.fn(),
    error: undefined,
  };

  it('renders correctly with initial props', () => {
    render(<TextEditor {...defaultProps} />);

    expect(screen.getByText('Text Content')).toBeInTheDocument();
    expect(screen.getByText('Generate content')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(
      'Your plain text content here'
    );
    expect(textarea).toBeInTheDocument();
    expect((textarea as HTMLTextAreaElement).value).toBe('');
  });

  it('displays the correct value in the textarea', () => {
    const props = { ...defaultProps, value: 'Hello World' };
    render(<TextEditor {...props} />);

    const textarea = screen.getByTestId('textarea');
    expect((textarea as HTMLTextAreaElement).value).toBe('Hello World');
  });

  it('calls onChange handler when text is entered into the textarea', () => {
    render(<TextEditor {...defaultProps} />);
    const textarea = screen.getByTestId('textarea');

    fireEvent.change(textarea, { target: { value: 'New text' } });

    expect(defaultProps.onChange).toHaveBeenCalledTimes(1);
  });

  it('calls generateContent handler when the "Generate content" link is clicked', () => {
    render(<TextEditor {...defaultProps} />);
    const generateButton = screen.getByText('Generate content');

    fireEvent.click(generateButton);

    expect(defaultProps.generateContent).toHaveBeenCalledTimes(1);
  });

  it('displays an error message when the error prop is provided', () => {
    const errorMessage = 'This is a required field';
    const props = { ...defaultProps, error: errorMessage };
    render(<TextEditor {...props} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('does not display an error message when the error prop is not provided', () => {
    render(<TextEditor {...defaultProps} />);

    // The original test had an incorrect assertion. This correctly checks that
    // no error message paragraph is rendered.
    const errorElement = screen.queryByText(/.+/, {
      selector: 'p.text-destructive',
    });
    expect(errorElement).not.toBeInTheDocument();
  });

  it('applies the destructive border class to the textarea when there is an error', () => {
    const props = { ...defaultProps, error: 'An error occurred' };
    render(<TextEditor {...props} />);
    const textarea = screen.getByTestId('textarea');

    // The component logic adds 'border-destructive' to the className string.
    expect(textarea.className).toContain('border-destructive');
  });

  it('does not apply the destructive border class when there is no error', () => {
    render(<TextEditor {...defaultProps} />);
    const textarea = screen.getByTestId('textarea');

    expect(textarea.className).not.toContain('border-destructive');
  });
});
