import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateFormSkeleton from '@/components/TemplateFormSkeleton';
import { vi } from 'vitest';

const onBack = vi.fn();
const renderComponent = (title = 'Test Title') =>
  render(<TemplateFormSkeleton title={title} onBack={onBack} />);

describe('TemplateFormSkeleton', () => {
  it('renders the title', () => {
    renderComponent();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', async () => {
    renderComponent();

    const button = screen.getByRole('button'); // Only one button in this component
    await userEvent.click(button);

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton loading elements', () => {
    renderComponent();

    const skeletons = screen.getAllByRole('generic'); // All divs with no role default to 'generic'
    // You expect 3 skeletons for the form + 1 wrapper + maybe others
    // Use a class check if you want to be more specific
    const pulseDivs = skeletons.filter((el) =>
      el.className.includes('animate-pulse')
    );
    expect(pulseDivs.length).toBe(3);
  });
});
