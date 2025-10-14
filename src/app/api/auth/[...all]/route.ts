import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "~/server/auth/server";

export const { POST, GET } = toNextJsHandler(auth);
