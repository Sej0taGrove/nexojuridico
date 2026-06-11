import bcrypt from "bcryptjs";
import { Prisma, UserRole, ValidationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  signPasswordResetToken,
  verifyAccessToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from "@/lib/auth/jwt";
import type { SpecialtyCode } from "@/lib/constants/specialties";

const DEFAULT_TENANT_SLUG = "vignes";

export type RegisterClientServiceInput = {
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone?: string;
  password: string;
};

export type RegisterLawyerServiceInput = {
  firstName: string;
  lastName: string;
  rut: string;
  phone: string;
  email: string;
  barNumber: string;
  specialties: SpecialtyCode[];
  password: string;
  certificates?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
};

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  rut: string | null;
};

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

async function getDefaultTenant() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: DEFAULT_TENANT_SLUG },
  });
  if (!tenant) {
    throw new AuthError(
      `Tenant inicial "${DEFAULT_TENANT_SLUG}" no encontrado. Ejecuta el seed.`,
      500,
    );
  }
  return tenant;
}

function toAuthUser(u: {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone: string | null;
  rut: string | null;
}): AuthUser {
  return {
    id: u.id,
    tenantId: u.tenantId,
    email: u.email,
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    rut: u.rut,
  };
}

export async function registerClient(
  data: RegisterClientServiceInput,
): Promise<AuthUser> {
  const tenant = await getDefaultTenant();

  const existing = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId: tenant.id, email: data.email.toLowerCase() },
    },
  });
  if (existing) {
    throw new AuthError("Ya existe una cuenta con este email", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: data.email.toLowerCase(),
      passwordHash,
      role: UserRole.client,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      rut: data.rut,
      phone: data.phone || null,
      emailVerifiedAt: null,
      clientProfile: {
        // region/comuna se completan en el onboarding posterior (TODO).
        create: { region: "", comuna: "" },
      },
    },
  });

  return toAuthUser(user);
}

export async function registerLawyer(
  data: RegisterLawyerServiceInput,
): Promise<AuthUser> {
  const tenant = await getDefaultTenant();

  const existing = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId: tenant.id, email: data.email.toLowerCase() },
    },
  });
  if (existing) {
    throw new AuthError("Ya existe una cuenta con este email", 409);
  }

  const specialties = await prisma.specialty.findMany({
    where: { code: { in: data.specialties } },
    select: { id: true, code: true },
  });
  if (specialties.length !== data.specialties.length) {
    throw new AuthError("Una o más especialidades son inválidas", 400);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: data.email.toLowerCase(),
      passwordHash,
      role: UserRole.lawyer,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      rut: data.rut,
      phone: data.phone,
      emailVerifiedAt: null,
      lawyerProfile: {
        create: {
          barNumber: data.barNumber,
          validationStatus: ValidationStatus.pending,
          isAvailable: false,
          certificatesUrl: data.certificates ? JSON.stringify(data.certificates) : null,
          specialties: {
            create: specialties.map((s, idx) => ({
              specialtyId: s.id,
              isPrimary: idx === 0,
            })),
          },
        },
      },
    },
  });

  return toAuthUser(user);
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; refreshToken: string; user: AuthUser }> {
  const tenant = await getDefaultTenant();

  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() },
    },
  });
  if (!user || user.deletedAt || !user.isActive) {
    throw new AuthError("Email o contraseña incorrectos", 401);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new AuthError("Email o contraseña incorrectos", 401);
  }

  const authUser = toAuthUser(user);

  const [token, refreshToken] = await Promise.all([
    signAccessToken({
      userId: authUser.id,
      email: authUser.email,
      role: authUser.role,
      tenantId: authUser.tenantId,
    }),
    signRefreshToken({
      userId: authUser.id,
      tenantId: authUser.tenantId,
    }),
  ]);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { token, refreshToken, user: authUser };
}

export async function logout(): Promise<void> {
  // Stateless por ahora: la invalidación ocurre del lado del cliente
  // borrando las cookies. Cuando agreguemos sesiones server-side,
  // marcar Session.revokedAt acá.
  return;
}

export async function verifyToken(token: string) {
  return verifyAccessToken(token);
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  token: string;
}> {
  const payload = await verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!user || user.deletedAt || !user.isActive) {
    throw new AuthError("Usuario inválido", 401);
  }

  const token = await signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  });

  return { token };
}

export async function createPasswordResetToken(
  email: string,
): Promise<string | null> {
  const tenant = await getDefaultTenant();
  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email: email.toLowerCase() } },
  });
  if (!user || user.deletedAt || !user.isActive) return null;

  return signPasswordResetToken({ userId: user.id });
}

export async function resetPassword(
  token: string,
  password: string,
): Promise<void> {
  let payload;
  try {
    payload = await verifyPasswordResetToken(token);
  } catch {
    throw new AuthError("Token inválido o expirado", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.deletedAt || !user.isActive) {
    throw new AuthError("Usuario inválido", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  password: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt || !user.isActive) {
    throw new AuthError("Usuario inválido", 401);
  }

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) {
    throw new AuthError("Contraseña actual incorrecta", 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt || !user.isActive) return null;
    return toAuthUser(user);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) return null;
    throw err;
  }
}
