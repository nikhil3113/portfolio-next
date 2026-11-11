import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    contact: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { DELETE, PATCH } from "@/app/api/contact/[id]/route";

const sessionMock = vi.mocked(getServerSession);
const findUniqueMock = vi.mocked(prisma.contact.findUnique);
const updateMock = vi.mocked(prisma.contact.update);
const deleteMock = vi.mocked(prisma.contact.delete);

const params = Promise.resolve({ id: "c1" });
const session = { user: { id: "u1" } };

function patch(body: unknown) {
  return new Request("http://localhost/api/contact/c1", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const deleteRequest = new Request("http://localhost/api/contact/c1", {
  method: "DELETE",
});

describe("PATCH /api/contact/[id]", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    findUniqueMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);

    const response = await PATCH(patch({ isRead: true }), { params });

    expect(response.status).toBe(401);
    expect(findUniqueMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 400 when isRead is not a boolean", async () => {
    sessionMock.mockResolvedValue(session as never);

    const response = await PATCH(patch({ isRead: "yes" }), { params });

    expect(response.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the contact does not exist", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue(null);

    const response = await PATCH(patch({ isRead: true }), { params });

    expect(response.status).toBe(404);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates the read state of an existing contact", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ id: "c1" } as never);
    updateMock.mockResolvedValue({ id: "c1", isRead: true } as never);

    const response = await PATCH(patch({ isRead: true }), { params });

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "c1" },
      data: { isRead: true },
    });
  });
});

describe("DELETE /api/contact/[id]", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    findUniqueMock.mockReset();
    updateMock.mockReset();
    deleteMock.mockReset();
  });

  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);

    const response = await DELETE(deleteRequest, { params });

    expect(response.status).toBe(401);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the contact does not exist", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue(null);

    const response = await DELETE(deleteRequest, { params });

    expect(response.status).toBe(404);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes an existing contact", async () => {
    sessionMock.mockResolvedValue(session as never);
    findUniqueMock.mockResolvedValue({ id: "c1" } as never);
    deleteMock.mockResolvedValue({ id: "c1" } as never);

    const response = await DELETE(deleteRequest, { params });

    expect(response.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "c1" } });
  });
});
