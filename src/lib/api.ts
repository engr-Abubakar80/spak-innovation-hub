import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { User } from "@prisma/client";
import { authOptions } from "./auth";
import { prisma } from "./db";
import { isAdmin } from "./permissions";
import { getClientIp } from "./rate-limit";

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export function forbidden(message = "You do not have permission to perform this action.") {
  return errorResponse(message, 403, "FORBIDDEN");
}

export function unauthorized(message = "You must be signed in.") {
  return errorResponse(message, 401, "UNAUTHORIZED");
}

export async function getApiUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.status === "SUSPENDED") return null;
  return user;
}

export async function requireApiUser(): Promise<User | null> {
  return getApiUser();
}

export async function getApiAdmin(): Promise<User | null> {
  const user = await getApiUser();
  if (!user || !isAdmin(user.role)) return null;
  return user;
}

export function clientIp(request: Request): string {
  return getClientIp(request.headers);
}
