import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EmailTemplateCard from '@/components/email-template/EmailTemplateCard';
import { EmailTemplate } from '@/types';

vi.mock(import('@/lib/utils'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    parseContent: (value: string) => value,
  };
});

const mockTemplate: EmailTemplate = {
  id: 'template-123',
  TemplateName: 'Welcome Email',
  Subject: 'Welcome to the platform',
  Html: '<p>Hello, this is your welcome email.</p>',
  Text: 'Hello, this is your welcome email.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOnDeleted = vi.fn();

const renderComponent = () =>
  render(
    <MemoryRouter>
      <EmailTemplateCard template={mockTemplate} onDeleted={mockOnDeleted} />
    </MemoryRouter>
  );

describe('EmailTemplateCard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the template name and subject', () => {
    renderComponent();

    expect(screen.getByText('Welcome Email')).toBeInTheDocument();
    expect(
      screen.getByText(/Subject: Welcome to the platform/)
    ).toBeInTheDocument();
  });

  it('shows the dropdown menu and delete option', async () => {
    renderComponent();

    const menuButton = screen.getByRole('button', { name: /open menu/i });
    await user.click(menuButton);

    const deleteOption = screen.getByText(/Delete/i);
    expect(deleteOption).toBeInTheDocument();

    await user.click(deleteOption);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('shows the dropdown menu and has an edit link pointing to the correct route', async () => {
    renderComponent();

    await user.click(screen.getByRole('button', { name: /open menu/i }));
    const editLink = screen.getByText('Edit');

    expect(editLink).toHaveAttribute('href', '/templates/template-123');
  });
});
