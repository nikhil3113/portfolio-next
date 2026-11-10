import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/projects/route";

const sessionMock = vi.mocked(getServerSession);
const createMock = vi.mocked(prisma.project.create);
const findManyMock = vi.mocked(prisma.project.findMany);

const validBody = {
  title: "Portfolio",
  description: "A portfolio site",
  tags: ["nextjs"],
  siteLink: "https://example.com",
  githubLink: "https://github.com/example/portfolio",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/x.png",
};

function post(body: unknown) {
  return new Request("http://localhost/api/projects", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/projects", () => {
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

  it("returns 400 when the title is missing", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await POST(post({ ...validBody, title: undefined }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 400 when tags is an empty array", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await POST(post({ ...validBody, tags: [] }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 201 with a valid body", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    createMock.mockResolvedValue({ id: "p1" } as never);
    const response = await POST(post(validBody));
    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledOnce();
  });
});

describe("GET /api/projects", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("returns 200 and the public project list", async () => {
    const projects = [{ id: "p1", title: "Portfolio" }];
    findManyMock.mockResolvedValue(projects as never);
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(projects);
  });
});
