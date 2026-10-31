import { describe, it, expect } from 'vitest';
import { IntakeWizardSchema, EventPlanSchema } from '@/domain/validators';
import { SAMPLE_WEDDING_PLAN } from '@/templates/sampleEvent';

describe('Domain Validators (Zod Schemas)', () => {
  it('validates a complete, authentic event plan (sample wedding)', () => {
    const parseResult = EventPlanSchema.safeParse(SAMPLE_WEDDING_PLAN);
    expect(parseResult.success).toBe(true);
  });

  it('validates a valid intake wizard payload', () => {
    const validIntake = {
      eventType: 'wedding',
      eventDate: '2026-12-25',
      city: 'Jaipur',
      guestCount: 250,
      totalBudgetRupees: 1500000,
      currency: 'INR',
      styleVibe: 'Royal Heritage with Rose Gold Decor',
      mustHaves: ['Outdoor Pheras under the stars'],
      constraints: {
        dietary: ['Pure Vegetarian buffet'],
        accessibility: ['Step-free mandap ramp'],
        cultureTraditions: [],
        neutralPreferences: [],
      },
      language: 'en',
    };

    const parseResult = IntakeWizardSchema.safeParse(validIntake);
    expect(parseResult.success).toBe(true);
  });

  it('rejects invalid dates or non-integer guest counts', () => {
    const invalidIntake = {
      eventType: 'wedding',
      eventDate: 'not-a-date',
      city: 'Delhi',
      guestCount: 2.5,
      totalBudgetRupees: 100, // below minimum
      currency: 'INR',
      styleVibe: '',
      constraints: { dietary: [], accessibility: [], cultureTraditions: [], neutralPreferences: [] },
    };

    const parseResult = IntakeWizardSchema.safeParse(invalidIntake);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      const issuePaths = parseResult.error.issues.map(i => i.path.join('.'));
      expect(issuePaths).toContain('eventDate');
      expect(issuePaths).toContain('guestCount');
      expect(issuePaths).toContain('totalBudgetRupees');
      expect(issuePaths).toContain('styleVibe');
    }
  });
});
