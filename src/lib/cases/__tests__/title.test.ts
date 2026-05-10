import { describe, it, expect } from 'vitest';
import { deriveCaseTitle, deriveCaseSummary } from '../title';

describe('Utilidades de Título - src/lib/cases/title.ts', () => {
  describe('deriveCaseTitle', () => {
    it('debe generar el título correcto con situación conocida', () => {
      expect(deriveCaseTitle({ situation: 'conflicto', specialtyName: 'Familia' }))
        .toBe('Conflicto en curso — Familia');
      
      expect(deriveCaseTitle({ situation: 'consulta', specialtyName: 'Penal' }))
        .toBe('Consulta general — Penal');
    });

    it('debe usar "Caso legal" si la situación es desconocida', () => {
      expect(deriveCaseTitle({ situation: 'unknown_sit', specialtyName: 'Laboral' }))
        .toBe('Caso legal — Laboral');
    });
  });

  describe('deriveCaseSummary', () => {
    it('debe retornar la descripción limpia si es más corta que el máximo', () => {
      expect(deriveCaseSummary('   Hola   mundo  ')).toBe('Hola mundo');
    });

    it('debe truncar la descripción y añadir puntos suspensivos si excede el máximo', () => {
      const longText = 'A'.repeat(300);
      const summary = deriveCaseSummary(longText, 240);
      expect(summary.length).toBe(240);
      expect(summary.endsWith('…')).toBe(true);
      expect(summary.startsWith('A'.repeat(239))).toBe(true);
    });
  });
});
