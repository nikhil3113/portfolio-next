import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { contact: { create: vi.fn() } },
}));
vi.mock("@/lib/brevo", () => ({ sendContactMail: vi.fn() }));

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendContactMail } from "@/lib/brevo";
import { resetRateLimit } from "@/lib/rate-limit";
import { POST } from "@/app/api/contact/route";

const createMock = vi.mocked(prisma.contact.create);
const mailMock = vi.mocked(sendContactMail);

const validBody = {
  name: "Nikhil",
  email: "nikhil@example.com",
  message: "Hello there",
};

const TEST_IP = "203.0.113.1";

function request(body: unknown, ip = TEST_IP) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    resetRateLimit();
    createMock.mockReset();
    mailMock.mockReset();
    createMock.mockResolvedValue({ id: "c1" } as never);
    mailMock.mockResolvedValue({ ok: true });
  });

  it("returns 400 when required fields are missing", async () => {
    const response = await POST(request({ name: "Only a name" }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid email", async () => {
    const response = await POST(
      request({ ...validBody, email: "not-an-email" })
    );
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("saves the contact and sends mail with trimmed values", async () => {
    const response = await POST(
      request({
        name: "  Nikhil  ",
        email: "  nikhil@example.com  ",
        message: "  Hello there  ",
      })
    );
    expect(response.status).toBe(200);
    expect(createMock).toHaveBeenCalledOnce();
    expect(createMock).toHaveBeenCalledWith({
      data: {
        name: "Nikhil",
        email: "nikhil@example.com",
        message: "Hello there",
        isRead: false,
        createdAt: expect.any(Date),
      },
    });
    expect(mailMock).toHaveBeenCalledWith({
      name: "Nikhil",
      email: "nikhil@example.com",
      message: "Hello there",
    });
  });

  it("returns 502 when the mailer fails but still saves the contact", async () => {
    mailMock.mockResolvedValue({ ok: false, error: "Mail is not configured" });
    const response = await POST(request(validBody));
    expect(response.status).toBe(502);
    expect(createMock).toHaveBeenCalledOnce();
  });

  it("returns 200 for honeypot submissions without side effects", async () => {
    const response = await POST(
      request({ ...validBody, website: "http://spam.example" })
    );
    expect(response.status).toBe(200);
    expect(createMock).not.toHaveBeenCalled();
    expect(mailMock).not.toHaveBeenCalled();
  });

  it("returns 429 after five requests from the same IP", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      const response = await POST(request(validBody));
      statuses.push(response.status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
