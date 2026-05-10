import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateUrgency } from '../urgency';

describe('calculateUrgency - src/lib/cases/urgency.ts', () => {
  beforeEach(() => {
    // Fijar la fecha actual para tests predecibles
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe retornar "alta" para fechas de hace menos de 30 días', () => {
    const yesterday = new Date('2026-05-09T12:00:00Z');
    expect(calculateUrgency(yesterday)).toBe('alta');

    const exact30Days = new Date('2026-04-10T12:00:00Z');
    expect(calculateUrgency(exact30Days)).toBe('alta');
  });

  it('debe retornar "media" para fechas entre 31 y 90 días', () => {
    const thirtyOneDays = new Date('2026-04-09T12:00:00Z');
    expect(calculateUrgency(thirtyOneDays)).toBe('media');

    const exact90Days = new Date('2026-02-09T12:00:00Z');
    expect(calculateUrgency(exact90Days)).toBe('media');
  });

  it('debe retornar "baja" para fechas mayores a 90 días', () => {
    const ninetyOneDays = new Date('2026-02-08T12:00:00Z');
    expect(calculateUrgency(ninetyOneDays)).toBe('baja');
  });

  it('debe retornar "baja" para fechas futuras', () => {
    const tomorrow = new Date('2026-05-11T12:00:00Z');
    expect(calculateUrgency(tomorrow)).toBe('baja');
  });
});
