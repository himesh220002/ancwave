import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "ancwave-super-secret-jwt-key-2026-production-grade";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "customer";
  name: string;
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

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

// Built-in demo credentials for immediate testing
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
  role: "customer",
};
