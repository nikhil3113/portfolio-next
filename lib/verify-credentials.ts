import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS_PER_IP = 20;

// A real bcrypt hash of a fixed dummy string, so an unknown email still pays
// the cost of a comparison instead of returning early.
const DUMMY_HASH =
  "$2b$10$mIQoXkiPXTvHmQKjlfI9p.879eo/NVZV65CHdBHHWO0/LY2ps26fO";

export type CredentialResult =
  | { ok: true; user: { id: string; email: string } }
  | { ok: false; reason: "invalid" | "locked" };

export async function verifyCredentials(
  rawEmail: string,
  password: string,
  ip: string,
): Promise<CredentialResult> {
  const email = rawEmail.trim().toLowerCase();
  const emailKey = `login:email:${email}:${ip}`;
  const ipKey = `login:ip:${ip}`;

  const emailLimit = checkRateLimit(emailKey, MAX_ATTEMPTS, WINDOW_MS);
  const ipLimit = checkRateLimit(ipKey, MAX_ATTEMPTS_PER_IP, WINDOW_MS);
  if (!emailLimit.allowed || !ipLimit.allowed) {
    return { ok: false, reason: "locked" };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Keep the response time close to a real comparison.
    await bcrypt.compare(password, DUMMY_HASH);
    return { ok: false, reason: "invalid" };
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return { ok: false, reason: "invalid" };
  }

  resetRateLimit(emailKey);
  return { ok: true, user: { id: user.id, email: user.email } };
}
