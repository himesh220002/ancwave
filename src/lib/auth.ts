import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "ancwave-super-secret-jwt-key-2026-production-grade";
export const DAILY_ADMIN_PASSCODE =
  process.env.DAILY_ADMIN_PASSCODE || "ancwave-ops-secure-2026";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "owner" | "admin" | "user" | "customer";
  name: string;
}

export interface DayTokenPayload {
  userId: string;
  email: string;
  role: "owner" | "admin";
  type: "ancwave_day_token";
  issuedAt: number;
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Signs a 24-hour operational day-token required for accessing the /admin dashboard route
 */
export function signDayToken(payload: {
  userId: string;
  email: string;
  role: "owner" | "admin";
}): string {
  const dayPayload: DayTokenPayload = {
    ...payload,
    type: "ancwave_day_token",
    issuedAt: Date.now(),
  };
  return jwt.sign(dayPayload, JWT_SECRET, { expiresIn: "24h" });
}

/**
 * Validates a 24-hour day-token
 */
export function verifyDayToken(token: string): DayTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DayTokenPayload;
    if (decoded.type !== "ancwave_day_token") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifies whether the provided passcode matches the DAILY_ADMIN_PASSCODE
 */
export function verifyDailyAdminPasscode(passcode: string): boolean {
  if (!passcode) return false;
  return passcode.trim() === DAILY_ADMIN_PASSCODE.trim();
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

// Built-in demo accounts for immediate testing
export const DEMO_OWNER: User = {
  id: "usr-owner-01",
  email: "owner@ancwave.com",
  name: "Marcus Vance (Founder & Owner)",
  role: "owner",
};

export const DEMO_ADMIN: User = {
  id: "usr-admin-01",
  email: "admin@ancwave.com",
  name: "Alexander Vance (Lead Architect)",
  role: "admin",
};

export const DEMO_CUSTOMER: User = {
  id: "usr-cust-01",
  email: "alex@example.com",
  name: "Alex Morgan",
  role: "user",
};

