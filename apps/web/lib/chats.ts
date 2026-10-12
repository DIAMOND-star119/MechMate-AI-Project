import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";

// Server-side ownership: every conversation operation goes through here.
// Returns null for missing AND foreign conversations alike (no existence leak).
export async function sessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  return session?.user?.id ?? null;
}

export async function getOwned(userId: string, conversationId: string) {
  return db.conversation.findFirst({
    where: { id: conversationId, userId },
    include: { messages: { orderBy: { seq: "asc" } } }
  });
}
