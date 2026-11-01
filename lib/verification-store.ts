import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { GameError } from "@/lib/game-auth";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const keyPattern = /^[a-z0-9][a-z0-9_-]{0,80}\/[a-z0-9_-]{3,30}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
const localRoot = path.resolve(process.env.VERIFICATION_LOCAL_DIR ?? path.join(process.cwd(), ".game-day", "verifications"));

type StoredObject = { body: Uint8Array; contentType: string };
type ObjectStore = {
  put(key: string, value: Uint8Array, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
  get(key: string): Promise<{ body: ReadableStream<Uint8Array>; httpMetadata?: { contentType?: string } } | null>;
  delete(key: string): Promise<unknown>;
};

export function screenshotKind(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_SCREENSHOT_BYTES) return null;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg" as const, contentType: "image/jpeg" };
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: "png" as const, contentType: "image/png" };
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return { ext: "webp" as const, contentType: "image/webp" };
  return null;
}

function assertKey(key: string) {
  if (!keyPattern.test(key)) throw new GameError("Invalid screenshot");
}

function remoteBucket(): ObjectStore | null {
  try {
    const bucket = (getCloudflareContext().env as { VERIFICATIONS?: ObjectStore }).VERIFICATIONS;
    if (!bucket) throw new GameError("Verification storage is not configured", 503);
    return bucket;
  } catch (error) {
    if (error instanceof GameError) throw error;
    const message = error instanceof Error ? error.message : "";
    if (message.includes("getCloudflareContext")) return null;
    throw error;
  }
}

function localFile(key: string) {
  assertKey(key);
  const file = path.resolve(localRoot, key);
  if (file !== localRoot && !file.startsWith(`${localRoot}${path.sep}`)) throw new GameError("Invalid screenshot");
  return file;
}

export async function putVerification(key: string, bytes: Uint8Array, contentType: string) {
  const bucket = remoteBucket();
  if (bucket) {
    assertKey(key);
    await bucket.put(key, bytes, { httpMetadata: { contentType } });
    return;
  }
  const file = localFile(key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

export async function readVerification(key: string): Promise<StoredObject | null> {
  const bucket = remoteBucket();
  if (bucket) {
    assertKey(key);
    const object = await bucket.get(key);
    if (!object) return null;
    return { body: new Uint8Array(await new Response(object.body).arrayBuffer()), contentType: object.httpMetadata?.contentType ?? "application/octet-stream" };
  }
  try {
    return { body: await readFile(localFile(key)), contentType: key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg" };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function removeVerification(key: string) {
  const bucket = remoteBucket();
  if (bucket) {
    assertKey(key);
    await bucket.delete(key);
    return;
  }
  await rm(localFile(key), { force: true });
}
