import { describe, it, expect } from 'vitest';
import { homeForRole, CLIENT_HOME, LAWYER_HOME, ADMIN_HOME } from '../roles';

describe('Roles Auth - src/lib/auth/roles.ts', () => {
  describe('homeForRole', () => {
    it('debe retornar la ruta de cliente', () => {
      expect(homeForRole('client')).toBe(CLIENT_HOME);
    });

    it('debe retornar la ruta de abogado', () => {
      expect(homeForRole('lawyer')).toBe(LAWYER_HOME);
    });

    it('debe retornar la ruta de admin', () => {
      expect(homeForRole('admin')).toBe(ADMIN_HOME);
    });

    it('debe retornar "/" para roles desconocidos o undefined', () => {
      expect(homeForRole(undefined)).toBe('/');
      expect(homeForRole('superadmin')).toBe('/');
    });
  });
});
