import { PrismaClient } from "@prisma/client";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { neon, types } from "@neondatabase/serverless";

const isCloudflareWorker = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

// Prisma expects these Postgres types as raw text. adapter-neon 5.x sets this for its
// WebSocket mode but not HTTP mode, where the driver would return Date objects instead.
const { builtins } = types;
const RAW_TEXT_TYPES = new Set<number>([
  builtins.DATE, builtins.TIME, builtins.TIMESTAMP, builtins.NUMERIC, builtins.JSON, builtins.JSONB,
]);
const prismaTypes = {
  ...types,
  getTypeParser: (oid: number, format?: "text" | "binary") => {
    if (oid === builtins.TIMESTAMPTZ || oid === builtins.TIMETZ) return (value: string) => value.split("+")[0];
    if (RAW_TEXT_TYPES.has(oid)) return (value: string) => value;
    return types.getTypeParser(oid, format as "text");
  },
} as typeof types;

// Workers can't run Prisma's native engine or share sockets across requests,
// so they query Neon over stateless HTTP instead.
function createClient() {
  if (!isCloudflareWorker) return new PrismaClient({ log: ["error"] });
  const sql = neon(process.env.DATABASE_URL ?? "");
  // The driver only reads `types` from per-query options, so attach it to every query.
  const query = ((text: string, params: unknown[], options: object) =>
    sql(text, params, { ...options, types: prismaTypes })) as unknown as typeof sql;
  return new PrismaClient({ adapter: new PrismaNeonHTTP(query), log: ["error"] });
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
