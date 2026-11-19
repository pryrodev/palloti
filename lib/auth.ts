import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "@/lib/prisma";

const baseURL = process.env.BETTER_AUTH_URL
  ?? process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined);

export const auth = betterAuth({
  appName: "SAC Holy Family Province CMS",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [baseURL, process.env.NEXT_PUBLIC_SITE_URL].filter((origin): origin is string => Boolean(origin)),
  database: prismaAdapter(prisma, { provider: "mysql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  plugins: [admin()],
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
});
