import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from "jose";

import type { UserRole } from "@prisma/client";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

const FALLBACK_ACCESS_SECRET =
  "dev-access-secret-do-not-use-in-production-please-set-JWT_SECRET";
const FALLBACK_REFRESH_SECRET =
  "dev-refresh-secret-do-not-use-in-production-please-set-JWT_REFRESH_SECRET";

let warnedAccess = false;
let warnedRefresh = false;

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (!warnedAccess) {
      console.warn(
        "[auth] JWT_SECRET no está definido. Usando fallback de desarrollo. NO usar en producción.",
      );
      warnedAccess = true;
    }
    return new TextEncoder().encode(FALLBACK_ACCESS_SECRET);
  }
  return new TextEncoder().encode(secret);
}

function getRefreshSecret(): Uint8Array {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    if (!warnedRefresh) {
      console.warn(
        "[auth] JWT_REFRESH_SECRET no está definido. Usando fallback de desarrollo. NO usar en producción.",
      );
      warnedRefresh = true;
    }
    return new TextEncoder().encode(FALLBACK_REFRESH_SECRET);
  }
  return new TextEncoder().encode(secret);
}

export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
};

export type RefreshTokenPayload = {
  userId: string;
  tenantId: string;
};

export async function signAccessToken(
  payload: AccessTokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getAccessSecret());
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessTokenPayload & JoseJWTPayload> {
  const { payload } = await jwtVerify(token, getAccessSecret());
  return payload as AccessTokenPayload & JoseJWTPayload;
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload & JoseJWTPayload> {
  const { payload } = await jwtVerify(token, getRefreshSecret());
  return payload as RefreshTokenPayload & JoseJWTPayload;
}

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 min
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 días
