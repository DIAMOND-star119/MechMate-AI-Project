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

// Vercel auto-provides every address that can reach this deployment: the
// unique deployment URL, the stable branch URL, and the production domain.
// Trusting all of them means login works no matter which address is opened,
// even after redeploys change the deployment URL. All three belong to this
// project, so nothing foreign is trusted. (These are only present if the
// "System Environment Variables" access is enabled in Vercel; the dynamic
// same-origin rule below covers every case regardless.)
const vercelOrigins = [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
]
  .filter((h): h is string => !!h)
  .map((h) => `https://${h}`);

// Static part of the trust list: configured site URL, Vercel addresses,
// and any extra origins from the environment.
const staticOrigins = () => [siteURL, ...vercelOrigins, ...extraOrigins];

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
  // stale. The configured/Vercel origins are always trusted, plus a dynamic
  // same-origin rule: a request whose Origin header names the very host it
  // was sent to is by definition same-origin (the app posts to its own
  // address), so it is accepted. A foreign page sends an Origin naming a
  // DIFFERENT host than the API URL, so cross-site forgery is still
  // rejected. This keeps login working on every current and future
  // deployment address with zero dashboard upkeep.
  trustedOrigins: async (request) => {
    const origins = staticOrigins();
    try {
      if (request) {
        const apiHost = new URL(request.url).host;
        const header =
          request.headers.get("origin") ?? request.headers.get("referer") ?? "";
        const sender = new URL(header).origin;
        if (new URL(sender).host === apiHost && !origins.includes(sender)) {
          origins.push(sender);
        }
      }
    } catch {
      // Unparseable URL/header: fall back to the static list only.
    }
    return origins;
  },
});
