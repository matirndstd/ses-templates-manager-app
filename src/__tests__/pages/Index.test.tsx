import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '@/pages/Index';

describe('Index', () => {
  it('should render the main heading, paragraph, and call-to-action link', () => {
    render(<Index />);

    const heading = screen.getByRole('heading', {
      name: /amazon ses manager/i,
    });
    expect(heading).toBeInTheDocument();

    const paragraph = screen.getByText(
      /manage your amazon ses templates and contact lists with ease/i
    );
    expect(paragraph).toBeInTheDocument();

    const getStartedLink = screen.getByRole('link', { name: /get started/i });
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink).toHaveAttribute('href', '#');
  });
});
