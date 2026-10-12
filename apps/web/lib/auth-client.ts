"use client";

import { createAuthClient } from "better-auth/react";
import { anonymousClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // In the browser always talk to the SAME origin serving the page. The old
  // fallback ("http://localhost:3000") sent production logins to the user's
  // own laptop, where nothing listens — fetch threw and the UI could only
  // show its generic error. Env remains as the SSR/build fallback.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000"),
  plugins: [anonymousClient(), usernameClient()]
});
