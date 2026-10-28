import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon } from "@neondatabase/serverless";

const isCloudflareWorker = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

// Workers can't run Prisma's native engine or share sockets across requests,
// so they query Neon over stateless HTTP instead.
function createClient() {
  if (!isCloudflareWorker) return new PrismaClient({ log: ["error"] });
  const adapter = new PrismaNeonHTTP(neon(process.env.DATABASE_URL ?? ""));
  return new PrismaClient({ adapter, log: ["error"] });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getClient() {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

// Created on first use so DATABASE_URL is read after the Worker populates process.env.
export const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    const client = getClient();
    const value = Reflect.get(client, prop);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
