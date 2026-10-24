import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { authOptions } from "./auth";
import { prisma } from "./db";
import { isAdmin, isSuperAdmin } from "./permissions";

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.status === "SUSPENDED") return null;
  return user;
}

export async function requireUser(redirectTo = "/login"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!isAdmin(user.role)) redirect("/dashboard");
  return user;
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?callbackUrl=/admin");
  if (!isSuperAdmin(user.role)) {
    redirect("/dashboard?error=access_denied");
  }
  return user;
}
