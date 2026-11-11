import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

import { prisma } from "@/lib/prisma";
import { resetRateLimit } from "@/lib/rate-limit";
import { verifyCredentials } from "@/lib/verify-credentials";

const findUniqueMock = vi.mocked(prisma.user.findUnique);

const passwordHash = bcrypt.hashSync("correct-password", 4);
const user = {
  id: "u1",
  email: "admin@example.com",
  password: passwordHash,
};

describe("verifyCredentials", () => {
  beforeEach(() => {
    resetRateLimit();
    findUniqueMock.mockReset();
  });

  it("accepts a valid email and password", async () => {
    findUniqueMock.mockResolvedValue(user as never);

    await expect(
      verifyCredentials("admin@example.com", "correct-password", "10.0.0.1"),
    ).resolves.toEqual({
      ok: true,
      user: { id: "u1", email: "admin@example.com" },
    });
  });

  it("rejects a wrong password", async () => {
    findUniqueMock.mockResolvedValue(user as never);

    await expect(
      verifyCredentials("admin@example.com", "wrong-password", "10.0.0.2"),
    ).resolves.toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects an unknown email without throwing", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await verifyCredentials(
      "nobody@example.com",
      "correct-password",
      "10.0.0.3",
    );

    expect(result).toEqual({ ok: false, reason: "invalid" });
  });

  it("locks after five failures for the same email and ip", async () => {
    findUniqueMock.mockResolvedValue(user as never);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await expect(
        verifyCredentials("admin@example.com", "wrong-password", "10.0.0.4"),
      ).resolves.toEqual({ ok: false, reason: "invalid" });
    }

    await expect(
      verifyCredentials("admin@example.com", "correct-password", "10.0.0.4"),
    ).resolves.toEqual({ ok: false, reason: "locked" });
  });

  it("clears the email bucket after a successful login", async () => {
    findUniqueMock.mockResolvedValue(user as never);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await verifyCredentials("admin@example.com", "wrong-password", "10.0.0.5");
    }

    await expect(
      verifyCredentials("admin@example.com", "correct-password", "10.0.0.5"),
    ).resolves.toMatchObject({ ok: true });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      await expect(
        verifyCredentials("admin@example.com", "wrong-password", "10.0.0.5"),
      ).resolves.toEqual({ ok: false, reason: "invalid" });
    }
  });

  it("normalizes the email before looking it up", async () => {
    findUniqueMock.mockResolvedValue(user as never);

    const result = await verifyCredentials(
      "  ADMIN@Example.com ",
      "correct-password",
      "10.0.0.6",
    );

    expect(result).toMatchObject({ ok: true });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { email: "admin@example.com" },
    });
  });
});
