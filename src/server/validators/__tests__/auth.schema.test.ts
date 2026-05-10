import { describe, it, expect } from 'vitest';
import { loginSchema, registerClientSchema } from '../auth.schema';

describe('Auth Schemas - src/server/validators/auth.schema.ts', () => {
  describe('loginSchema', () => {
    it('debe validar un login correcto', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        remember: true,
      });
      expect(result.success).toBe(true);
    });

    it('debe rechazar email inválido', () => {
      const result = loginSchema.safeParse({
        email: 'testexample.com', // Sin @
        password: 'Password123',
        remember: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Ingresa un email válido');
      }
    });

    it('debe rechazar contraseña demasiado corta', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '123',
        remember: false,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('La contraseña debe tener al menos 8 caracteres');
      }
    });
  });

  describe('registerClientSchema', () => {
    it('debe validar un registro de cliente correcto', () => {
      const result = registerClientSchema.safeParse({
        firstName: 'Juan',
        lastName: 'Pérez',
        rut: '12345678-5', // RUT Válido
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        acceptTerms: true,
      });
      expect(result.success).toBe(true);
    });

    it('debe rechazar RUT inválido', () => {
      const result = registerClientSchema.safeParse({
        firstName: 'Juan',
        lastName: 'Pérez',
        rut: '12345678-4', // RUT Inválido
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        acceptTerms: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        // En Zod, filter para encontrar el error de RUT
        const rutError = result.error.issues.find(i => i.path.includes('rut'));
        expect(rutError?.message).toBe('RUT inválido');
      }
    });

    it('debe rechazar contraseñas que no coinciden', () => {
      const result = registerClientSchema.safeParse({
        firstName: 'Juan',
        lastName: 'Pérez',
        rut: '12345678-5',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password321', // No coinciden
        acceptTerms: true,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find(i => i.path.includes('confirmPassword'));
        expect(error?.message).toBe('Las contraseñas no coinciden');
      }
    });

    it('debe rechazar si no se aceptan los términos', () => {
      const result = registerClientSchema.safeParse({
        firstName: 'Juan',
        lastName: 'Pérez',
        rut: '12345678-5',
        email: 'juan@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        acceptTerms: false, // Falso
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const termError = result.error.issues.find(i => i.path.includes('acceptTerms'));
        expect(termError?.message).toContain('Términos');
      }
    });
  });
});
