import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { env } from "~/env";
import { initAuth } from ".";

const baseUrl =
  env.NODE_ENV === "production" && env.PRODUCTION_URL
    ? env.PRODUCTION_URL
    : "http://localhost:3000";

export const auth = initAuth({
  baseUrl,
  secret: env.AUTH_SECRET,
  googleClientId: env.AUTH_GOOGLE_ID,
  googleClientSecret: env.AUTH_GOOGLE_SECRET,
});

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
