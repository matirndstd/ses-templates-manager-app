import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailPreview from '@/components/email-template/EmailPreview';
import { describe, it, vi, expect } from 'vitest';

const toggleMock = vi.fn();
const mockTemplate = {
  Subject: 'Test Subject',
  Html: '<p>Hello world</p>',
  Text: 'Hello world text version',
};

const renderComponent = (template, isVisible) =>
  render(
    <EmailPreview
      template={template}
      isVisible={isVisible}
      onToggleVisibility={toggleMock}
    />
  );

describe('EmailPreview', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
  });

  it('renders toggle button when preview is not visible', async () => {
    renderComponent(mockTemplate, false);

    const toggleButton = screen.getByRole('button', {
      name: /show email preview/i,
    });
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);
    expect(toggleMock).toHaveBeenCalled();
  });

  it('renders preview with subject, HTML, and text when visible', () => {
    renderComponent(mockTemplate, true);

    expect(screen.getByTitle('Email Preview')).toBeInTheDocument();
    expect(screen.getByText(/subject: test subject/i)).toBeInTheDocument();
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    expect(screen.getByText(/hello world text version/i)).toBeInTheDocument();
  });

  it('renders fallback when HTML is missing', () => {
    renderComponent({ Subject: 'Only Text', Text: 'Plain text only' }, true);

    expect(screen.getByText(/no html content to preview/i)).toBeInTheDocument();
    expect(screen.getByText(/plain text only/i)).toBeInTheDocument();
  });

  it('renders fallback when subject is missing', () => {
    renderComponent({ Html: '<div></div>' }, true);

    expect(screen.getByText(/subject: no subject/i)).toBeInTheDocument();
  });

  it('triggers refresh animation when refresh is clicked', async () => {
    renderComponent(mockTemplate, true);

    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    const refreshIcon = refreshBtn.querySelector('svg');

    expect(refreshIcon?.classList.contains('animate-spin')).toBe(false);

    await user.click(refreshBtn);
    expect(refreshBtn).toBeDisabled();
    expect(refreshIcon?.classList.contains('animate-spin')).toBe(true);
    await waitFor(() => {
      expect(refreshBtn).not.toBeDisabled();
      expect(refreshIcon?.classList.contains('animate-spin')).toBe(false);
    });
  });
});
