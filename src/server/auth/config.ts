import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "~/server/db";
import bcrypt from "bcryptjs";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          console.log("Credentials:::::::::::::::::::::::::::", credentials);
          let user = null;
          const email: string = (credentials?.email as string) ?? "";
          const password: string = (credentials?.password as string) ?? "";

          if (!email || !password) {
            throw new Error("Email and password are required");
          }
          // const x = bcrypt.hashSync("Fortis et liber!1", 10);
          // const y = bcrypt.hashSync("Fortis et liber!1", 10);
          // const pwHash = await bcrypt.hash(password, 10);

          // console.log({ x, y, pwHash });
          // console.log({ msg: "Testing", pwHash });
          // console.log({ email, password });
          user = await db.user.findFirst({
            where: {
              email: email,
            },
          });

          if (!user?.password) {
            console.log("::::::::::::::PWHASH NOT FOUND");
            throw new Error("Invalid email or password");
          }

          if (bcrypt.compareSync(password, user.password)) {
            console.log("::::::::::::::User authenticated successfully");
            return user;
          }

          console.log("::::::::::::::Conditions not met");

          // default to throwing an error
          throw new Error("Invalid email or password");
        } catch (error) {
          console.error("Error in authorize:", error);
          return null;
        }
      },
    }),
    GoogleProvider,
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(db),
  callbacks: {
    signIn: async (params) => {
      const { account, user } = params;

      console.log({ msg: ":::::::", account, user });
      return true; // TEMPORARY: allow all sign-ins

      if (account?.provider === "email") {
        const existingUser = await db.user.findFirst({
          where: { email: user.email },
        });
        if (existingUser) {
          return true;
        }
      } else if (account?.provider === "google") {
        const existingUser = await db.user.findFirst({
          where: { email: user.email },
        });
        if (existingUser) {
          return true;
        }
      }

      // disable registration/login for EVERYONE but me
      return false;
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
} satisfies NextAuthConfig;
