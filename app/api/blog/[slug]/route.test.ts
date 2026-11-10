import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    blog: { findUnique: vi.fn(), delete: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DELETE, PUT } from "@/app/api/blog/[slug]/route";

const sessionMock = vi.mocked(getServerSession);
const findUniqueMock = vi.mocked(prisma.blog.findUnique);
const deleteMock = vi.mocked(prisma.blog.delete);
const updateMock = vi.mocked(prisma.blog.update);
const revalidatePathMock = vi.mocked(revalidatePath);

const params = Promise.resolve({ slug: "hello" });
const request = new Request("http://localhost/api/blog/hello", {
  method: "DELETE",
});
const session = { user: { id: "u1" } };

describe("DELETE /api/blog/[slug]", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    findUniqueMock.mockReset();
    deleteMock.mockReset();
    updateMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);

    const response = await DELETE(request, { params });

    expect(response.status).toBe(401);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the blog does not exist", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue(null);

    const response = await DELETE(request, { params });

    expect(response.status).toBe(404);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes an existing blog", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ id: "b1", slug: "hello" } as never);
    deleteMock.mockResolvedValue({ id: "b1" } as never);

    const response = await DELETE(request, { params });

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({ where: { slug: "hello" } });
  });

  it("revalidates the blog, list, home, and sitemap", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ id: "b1", slug: "hello" } as never);
    deleteMock.mockResolvedValue({ id: "b1" } as never);

    await DELETE(request, { params });

    expect(revalidatePathMock).toHaveBeenCalledWith("/blogs/hello");
    expect(revalidatePathMock).toHaveBeenCalledWith("/blogs");
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("returns 500 when the delete fails", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ id: "b1", slug: "hello" } as never);
    deleteMock.mockRejectedValue(new Error("database down"));

    const response = await DELETE(request, { params });

    expect(response.status).toBe(500);
  });
});

const validPutBody = {
  h1: "Hello",
  metaDescription: "A post",
  content: "<p>Body</p>",
  imageUrl: "https://res.cloudinary.com/demo/image/upload/x.png",
  author: "Nikhil",
  isPublished: true,
};

function put(body: unknown) {
  return new Request("http://localhost/api/blog/hello", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/blog/[slug]", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    findUniqueMock.mockReset();
    updateMock.mockReset();
    revalidatePathMock.mockReset();
  });

  it("returns 400 for a javascript image URL", async () => {
    sessionMock.mockResolvedValue(session as never);

    const response = await PUT(
      put({ ...validPutBody, imageUrl: "javascript:alert(1)" }),
      { params },
    );

    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 409 when the update hits a unique constraint", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue(null);
    updateMock.mockRejectedValue({ code: "P2002" });

    const response = await PUT(put(validPutBody), { params });

    expect(response.status).toBe(409);
  });

  it("keeps an existing legacy slug editable when it is unchanged", async () => {
    const legacyParams = Promise.resolve({ slug: "Legacy_Post" });
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue(null);
    updateMock.mockResolvedValue({ id: "b1" } as never);

    const response = await PUT(
      put({ ...validPutBody, newSlug: "Legacy_Post" }),
      { params: legacyParams },
    );

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "Legacy_Post" }),
      }),
    );
  });
});
