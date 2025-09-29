import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateDetailsForm from '@/components/email-template/TemplateDetailsForm';
import type { EmailTemplate } from '@/types';

// Mocks for editors
vi.mock('@/components/email-template/HtmlEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ value, onChange }: any) => (
    <textarea
      aria-label="HTML Editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

vi.mock('@/components/email-template/TextEditor', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ value, onChange, generateContent }: any) => (
    <div>
      <textarea
        aria-label="Text Editor"
        value={value}
        onChange={(e) =>
          onChange({ target: { name: 'Text', value: e.target.value } })
        }
      />
      <button onClick={generateContent}>Generate Text</button>
    </div>
  ),
}));

describe('TemplateDetailsForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  const mockFormData: Partial<EmailTemplate> = {
    TemplateName: 'Welcome Email',
    Subject: 'Hello!',
    Html: '<p>Hello World</p>',
    Text: 'Hello World',
  };

  const mockErrors = {
    TemplateName: '',
    Subject: '',
    Html: '',
    Text: '',
  };

  const handleChange = vi.fn();
  const handleHtmlChange = vi.fn();
  const setTab = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders form inputs and tabs correctly', () => {
    render(
      <TemplateDetailsForm
        formData={mockFormData}
        errors={mockErrors}
        tab="html"
        handleChange={handleChange}
        handleHtmlChange={handleHtmlChange}
        setTab={setTab}
      />
    );

    // Inputs
    expect(screen.getByLabelText(/Template Name/i)).toHaveValue(
      'Welcome Email'
    );
    expect(screen.getByLabelText(/Subject/i)).toHaveValue('Hello!');

    // Tabs
    expect(
      screen.getByRole('tab', { name: /HTML Content/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Text Content/i })
    ).toBeInTheDocument();

    // HTML Content is shown
    expect(screen.getByLabelText(/HTML Editor/i)).toBeInTheDocument();
  });

  it('displays validation errors when present', () => {
    render(
      <TemplateDetailsForm
        formData={mockFormData}
        errors={{
          TemplateName: 'Required',
          Subject: '',
          Html: '',
          Text: '',
        }}
        tab="html"
        handleChange={handleChange}
        handleHtmlChange={handleHtmlChange}
        setTab={setTab}
      />
    );

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('switches to Text tab and renders TextEditor', () => {
    render(
      <TemplateDetailsForm
        formData={mockFormData}
        errors={mockErrors}
        tab="text"
        handleChange={handleChange}
        handleHtmlChange={handleHtmlChange}
        setTab={setTab}
      />
    );

    // Text editor should be visible now
    expect(screen.getByLabelText(/Text Editor/i)).toBeInTheDocument();
  });

  it('calls handleHtmlChange when HTML content changes', async () => {
    render(
      <TemplateDetailsForm
        formData={mockFormData}
        errors={mockErrors}
        tab="html"
        handleChange={handleChange}
        handleHtmlChange={handleHtmlChange}
        setTab={setTab}
      />
    );

    const htmlTextarea = screen.getByLabelText(/HTML Editor/i);
    fireEvent.change(htmlTextarea, { target: { value: '<h1>Updated</h1>' } });
    expect(handleHtmlChange).toHaveBeenCalledWith('<h1>Updated</h1>');
  });

  it('calls handleChange when Text content changes and generateContent works', () => {
    render(
      <TemplateDetailsForm
        formData={mockFormData}
        errors={mockErrors}
        tab="text"
        handleChange={handleChange}
        handleHtmlChange={handleHtmlChange}
        setTab={setTab}
      />
    );

    const textTextarea = screen.getByLabelText(/Text Editor/i);
    fireEvent.change(textTextarea, { target: { value: 'Updated Text' } });

    expect(handleChange).toHaveBeenCalledWith({
      target: { name: 'Text', value: 'Updated Text' },
    });

    const generateBtn = screen.getByRole('button', { name: /generate text/i });
    fireEvent.click(generateBtn);

    expect(handleChange).toHaveBeenCalled();
  });
});
