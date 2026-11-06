import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins/admin";
import { expo } from "@better-auth/expo";
import { prisma } from "@ifarm/db";
import { roles } from "@ifarm/shared";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  secret:
    process.env.BETTER_AUTH_SECRET || "dev-secret-ifarm-local-32chars-min-key-ok",
  baseURL:
    process.env.BETTER_AUTH_URL || "https://ifarm-api-0976.onrender.com",
  session: {
    cookieCache: {
      enabled: true,
    },
  },
  // "exp://**" cobre o Expo Go em dev; "ifarmmobile://" cobre um dev client/build standalone;
  // os demais cobrem o alvo "web" do Expo (navegador), rodando em localhost ou na rede local.
  trustedOrigins: [
    "exp://**",
    "ifarmmobile://",
    "localhost:*",
    "127.0.0.1:*",
    "192.168.*.*:*",
    "10.*.*.*:*",
    "172.16.*.*:*",
    "https://*.github.io",
    "https://felipemzero.github.io",
  ],
  advanced: {
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
  plugins: [admin({ roles, defaultRole: "worker" }), expo()],
});
