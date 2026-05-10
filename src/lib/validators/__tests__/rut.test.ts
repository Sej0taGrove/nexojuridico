import { describe, it, expect } from 'vitest';
import { cleanRut, formatRut, isValidRut } from '../rut';

describe('Utilidades de RUT - src/lib/validators/rut.ts', () => {
  describe('cleanRut', () => {
    it('debe eliminar puntos y guiones y convertir k a mayúscula', () => {
      expect(cleanRut('12.345.678-k')).toBe('12345678K');
      expect(cleanRut('12345678-K')).toBe('12345678K');
      expect(cleanRut('12.345.678-9')).toBe('123456789');
    });

    it('debe manejar entradas sin formato', () => {
      expect(cleanRut('12345678K')).toBe('12345678K');
      expect(cleanRut(' 12345678 - K ')).toBe('12345678K');
    });
  });

  describe('formatRut', () => {
    it('debe formatear rut correctamente con puntos y guion', () => {
      expect(formatRut('12345678k')).toBe('12.345.678-K');
      expect(formatRut('123456789')).toBe('12.345.678-9');
      expect(formatRut('1234567K')).toBe('1.234.567-K'); // RUT corto
    });

    it('debe dejar entradas incompletas como están si son muy cortas', () => {
      expect(formatRut('1')).toBe('1');
    });
  });

  describe('isValidRut', () => {
    it('debe retornar true para RUTs válidos', () => {
      expect(isValidRut('12345678-5')).toBe(true);
      expect(isValidRut('9.999.999-3')).toBe(true);
      expect(isValidRut('10000013-K')).toBe(true);
      expect(isValidRut('10000013-k')).toBe(true);
    });

    it('debe retornar false para RUTs inválidos', () => {
      expect(isValidRut('12345678-4')).toBe(false); // Mismo dígito, DV erróneo
      expect(isValidRut('12.345.678-K')).toBe(false);
      expect(isValidRut('11.111.111-2')).toBe(false);
    });

    it('debe retornar false para longitudes incorrectas', () => {
      expect(isValidRut('12345-6')).toBe(false); // Muy corto
      expect(isValidRut('1234567890-1')).toBe(false); // Muy largo
    });
  });
});
