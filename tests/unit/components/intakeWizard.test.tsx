import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntakeWizard } from '@/components/intake/IntakeWizard';

describe('IntakeWizard Step Transition', () => {
  it('moves from step 1 to step 2 when Next Step is clicked with default valid values', () => {
    const onPlanGenerated = vi.fn();
    const onLoadSample = vi.fn();

    render(
      <IntakeWizard
        onPlanGenerated={onPlanGenerated}
        onLoadSample={onLoadSample}
        isLoading={false}
        language="en"
      />
    );

    // Verify Step 1 is active
    expect(screen.getByText('Event Basics')).toBeInTheDocument();

    // Find and click Next Step button
    const nextButton = screen.getByRole('button', { name: /Next/i });
    expect(nextButton).toBeInTheDocument();
    fireEvent.click(nextButton);

    // Verify Step 2 is now active
    expect(screen.getByText('Financials')).toBeInTheDocument();
  });
});
