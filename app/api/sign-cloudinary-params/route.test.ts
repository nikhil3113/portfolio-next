import { beforeEach, describe, expect, it, vi } from "vitest";

process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";
delete process.env.CLOUDINARY_ALLOWED_FOLDER;

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    utils: { api_sign_request: vi.fn(() => "test-signature") },
    uploader: { destroy: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";
import { DELETE, POST } from "@/app/api/sign-cloudinary-params/route";

const sessionMock = vi.mocked(getServerSession);
const signMock = vi.mocked(cloudinary.utils.api_sign_request);
const destroyMock = vi.mocked(cloudinary.uploader.destroy);

function request(body: unknown, method: "POST" | "DELETE") {
  return new Request("http://localhost/api/sign-cloudinary-params", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/sign-cloudinary-params", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    signMock.mockReturnValue("test-signature");
  });

  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);
    const response = await POST(
      request({ paramsToSign: { timestamp: 1 } }, "POST")
    );
    expect(response.status).toBe(401);
    expect(signMock).not.toHaveBeenCalled();
  });

  it("signs allowed parameters for an authenticated request", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await POST(
      request(
        { paramsToSign: { timestamp: 1, upload_preset: "x" } },
        "POST"
      )
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      signature: "test-signature",
    });
    expect(signMock).toHaveBeenCalledOnce();
  });

  it("rejects parameters outside the allowlist", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await POST(
      request({ paramsToSign: { evil: "x" } }, "POST")
    );
    expect(response.status).toBe(400);
    expect(signMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/sign-cloudinary-params", () => {
  beforeEach(() => {
    sessionMock.mockReset();
    destroyMock.mockReset();
    destroyMock.mockResolvedValue({ result: "ok" } as never);
  });

  it("returns 401 without a session", async () => {
    sessionMock.mockResolvedValue(null);
    const response = await DELETE(
      request({ publicId: "portfolio/image" }, "DELETE")
    );
    expect(response.status).toBe(401);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("rejects path traversal in the public ID", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await DELETE(
      request({ publicId: "../../secret" }, "DELETE")
    );
    expect(response.status).toBe(400);
    expect(destroyMock).not.toHaveBeenCalled();
  });

  it("deletes a valid public ID for an authenticated request", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const response = await DELETE(
      request({ publicId: "portfolio/image" }, "DELETE")
    );
    expect(response.status).toBe(200);
    expect(destroyMock).toHaveBeenCalledWith("portfolio/image");
  });
});
