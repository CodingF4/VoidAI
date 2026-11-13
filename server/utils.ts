import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import path from "path";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/** Local disk in development; /tmp on Vercel (ephemeral, but writable). */
export function getUploadsDir(): string {
  if (process.env.VERCEL || process.env.UPLOADS_DIR) {
    return process.env.UPLOADS_DIR || path.join("/tmp", "uploads");
  }
  return path.join(process.cwd(), "uploads");
}
