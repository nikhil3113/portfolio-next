import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    blog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/blog/route";

const sessionMock = vi.mocked(getServerSession);
const createMock = vi.mocked(prisma.blog.create);

const validBody = {
  h1: "Hello",
  metaDescription: "A post",
  content: "<p>Body</p>",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/x.png",
  author: "Nikhil",
  isPublished: true,
  slug: "hello",
};

function post(body: unknown) {
  return new Request("http://localhost/api/blog", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/blog", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    createMock.mockReset();
  });

  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);
    const response = await POST(post(validBody));
    expect(response.status).toBe(401);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 when required fields are missing", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await POST(post({ h1: "Only title" }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("creates a blog and revalidates the public paths", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    createMock.mockResolvedValue({ id: "b1" } as never);
    const response = await POST(post(validBody));
    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledOnce();
  });
});
