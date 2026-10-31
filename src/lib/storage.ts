import { EventPlanSchema, SCHEMA_VERSION, ValidatedEventPlan } from '../domain/validators';
import { SAMPLE_WEDDING_PLAN } from '../templates/sampleEvent';
import { SafeLogger } from './logger';

const STORAGE_KEY = 'jashn_event_plan_v1';

export class LocalPlanStorage {
  public static load(): ValidatedEventPlan | null {
    if (typeof window === 'undefined') return null;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      // Migrate or validate
      if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
        parsed.schemaVersion = SCHEMA_VERSION;
      }

      const validation = EventPlanSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      }

      SafeLogger.warn('Corrupted event plan in localStorage. Attempting safe recovery.');
      return this.recoverCorruptedPlan(parsed);
    } catch (err: unknown) {
      SafeLogger.error('Failed to read from localStorage', err);
      return null;
    }
  }

  public static save(plan: ValidatedEventPlan): boolean {
    if (typeof window === 'undefined') return false;

    try {
      plan.updatedAt = new Date().toISOString();
      const validation = EventPlanSchema.safeParse(plan);
      if (!validation.success) {
        SafeLogger.error('Plan failed validation before saving', validation.error);
        return false;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(validation.data));
      return true;
    } catch (err: unknown) {
      SafeLogger.error('Failed to save to localStorage', err);
      return false;
    }
  }

  public static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    // Clear any temporary caches or states
    sessionStorage.clear();
    SafeLogger.info('All local user data permanently purged.');
  }

  public static loadSampleWedding(): ValidatedEventPlan {
    this.save(SAMPLE_WEDDING_PLAN);
    return SAMPLE_WEDDING_PLAN;
  }

  private static recoverCorruptedPlan(corrupted: any): ValidatedEventPlan | null {
    try {
      // Re-anchor to valid structure using baseline wedding template
      const recovered: ValidatedEventPlan = {
        ...SAMPLE_WEDDING_PLAN,
        id: corrupted.id || crypto.randomUUID(),
        title: corrupted.title || 'Recovered Celebration Plan',
        city: corrupted.city || 'Hyderabad',
        eventDate: corrupted.eventDate || '2026-12-18',
        eventType: corrupted.eventType || 'wedding',
        guestCount: Number(corrupted.guestCount) || 200,
        updatedAt: new Date().toISOString(),
      };
      this.save(recovered);
      return recovered;
    } catch {
      return null;
    }
  }
}
