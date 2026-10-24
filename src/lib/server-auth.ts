import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./db";
import { isSuperAdmin } from "./permissions";

export async function requireApiSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.status === "SUSPENDED" || !isSuperAdmin(user.role)) return null;
  return user;
}

export async function requireApiAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user || user.status === "SUSPENDED") return null;
  const role = user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") return null;
  return user;
}
