import { describe, it, expect } from 'vitest';
import { createCaseSchema } from '../case.schema';

describe('Case Schemas - src/server/validators/case.schema.ts', () => {
  describe('createCaseSchema', () => {
    const validData = {
      specialtyId: 1,
      responses: {
        situation: 'conflicto',
        occurredAt: '2026-05-01',
        hasDocuments: true,
        description: 'Esta es una descripción del caso que tiene al menos cincuenta caracteres para poder pasar la validación principal de Zod.',
      },
      region: 'Metropolitana de Santiago',
      comuna: 'Santiago',
      preferredContact: 'email',
      phone: '+56 9 1234 5678'
    };

    it('debe validar un caso correcto', () => {
      const result = createCaseSchema.safeParse(validData);
      // Ignoramos el error de tipo estricto en la refión, ya que 'RM' debiese estar en CHILE_REGIONS. 
      // El test pasará si coinciden los enums.
      expect(result.success).toBe(true);
    });

    it('debe rechazar si la fecha es futura', () => {
      const result = createCaseSchema.safeParse({
        ...validData,
        responses: {
          ...validData.responses,
          occurredAt: '2099-01-01', // Futuro
        }
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(i => i.path.includes('occurredAt'));
        expect(error?.message).toBe('La fecha no puede ser futura');
      }
    });

    it('debe rechazar una descripción muy corta', () => {
      const result = createCaseSchema.safeParse({
        ...validData,
        responses: {
          ...validData.responses,
          description: 'Muy corta',
        }
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(i => i.path.includes('description'));
        expect(error?.message).toBe('Mínimo 50 caracteres');
      }
    });

    it('debe rechazar un teléfono inválido', () => {
      const result = createCaseSchema.safeParse({
        ...validData,
        phone: '12345'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(i => i.path.includes('phone'));
        expect(error?.message).toBe('Formato inválido. Usa +56 9 XXXX XXXX');
      }
    });
  });
});
