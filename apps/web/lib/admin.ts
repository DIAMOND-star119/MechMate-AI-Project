import { db } from "./db";

export async function isAdmin(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const u = await db.user.findUnique({ where: { id: userId }, select: { role: true, username: true } });
  if (!u) return false;
  if (u.role === "admin") return true;
  const bootstrap = process.env.ADMIN_USERNAME;
  return !!bootstrap && u.username?.toLowerCase() === bootstrap.toLowerCase();
}
