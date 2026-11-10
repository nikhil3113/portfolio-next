import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: { blog: { findUnique: vi.fn(), delete: vi.fn() } },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { DELETE } from "@/app/api/blog/[slug]/route";

const sessionMock = vi.mocked(getServerSession);
const findUniqueMock = vi.mocked(prisma.blog.findUnique);
const deleteMock = vi.mocked(prisma.blog.delete);
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
