import { describe, it, expect } from 'vitest';
import { Money } from '@/domain/money';
import { toPaise } from '@/domain/types';

describe('Money Domain Engine (Paise Minor Units)', () => {
  it('creates money from paise and preserves integer values', () => {
    const m = Money.fromPaise(15050);
    expect(m.paise).toBe(15050);
    expect(m.rupees).toBe(150.5);
  });

  it('creates money from rupees without float rounding error', () => {
    const m = Money.fromRupees(19.99);
    expect(m.paise).toBe(1999);
    expect(m.rupees).toBe(19.99);
  });

  it('throws on non-integer paise or non-finite numbers', () => {
    expect(() => toPaise(12.34)).toThrow(TypeError);
    expect(() => Money.fromRupees(Infinity)).toThrow(TypeError);
  });

  it('performs exact addition and subtraction', () => {
    const m1 = Money.fromPaise(5000);
    const m2 = Money.fromPaise(2500);

    const sum = m1.add(m2);
    expect(sum.paise).toBe(7500);

    const diff = m1.subtract(m2);
    expect(diff.paise).toBe(2500);
  });

  it('performs multiplication and division correctly', () => {
    const m = Money.fromPaise(10000);
    const multiplied = m.multiply(1.5);
    expect(multiplied.paise).toBe(15000);

    const divided = m.divide(3);
    expect(divided.paise).toBe(3333);
  });

  it('compares amounts correctly', () => {
    const a = Money.fromPaise(100);
    const b = Money.fromPaise(200);
    const c = Money.fromPaise(100);

    expect(a.isLessThan(b)).toBe(true);
    expect(b.isGreaterThan(a)).toBe(true);
    expect(a.equals(c)).toBe(true);
  });

  it('formats currency correctly in Indian numbering system', () => {
    const lakh = Money.fromRupees(100000);
    const formattedINR = lakh.format('INR');
    // Normalizes non-breaking spaces if any
    expect(formattedINR.replace(/\u00a0/g, ' ')).toMatch(/₹\s?1,00,000/);
  });
});
