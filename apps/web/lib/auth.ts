import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { anonymous, username } from "better-auth/plugins";
import { db } from "./db";

// Production base URL. Explicit BETTER_AUTH_URL wins (set it to the live
// origin, e.g. https://mechmate-ai.vercel.app). On Vercel the platform always
// provides VERCEL_URL for the current deployment, so auth keeps working on
// preview/alias URLs even if BETTER_AUTH_URL was forgotten. Local fallback
// keeps `next dev` working with zero config.
const siteURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
  "http://localhost:3000";

// Extra origins the server accepts auth POSTs from (comma-separated). The
// primary origin (siteURL above) is always trusted; use this for preview
// deployments or a custom domain alongside the main URL.
const extraOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Identity (brief §§22–24): username+password signup, email never required.
// Email sign-in and anonymous guest keep working; guests can upgrade to a
// username account without losing progress (see /api/account/merge).
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, requireEmailVerification: false },
  user: { deleteUser: { enabled: true } },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 }
  },
  plugins: [anonymous(), username()],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: siteURL,
  // Without this, every browser auth POST from the production origin is
  // rejected with 403 INVALID_ORIGIN whenever BETTER_AUTH_URL is unset or
  // stale. The primary origin is always trusted; extras come from the env.
  trustedOrigins: [siteURL, ...extraOrigins],
});
