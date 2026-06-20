import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #a855f7 0%, #8b5cf6 50%, #ec4899 100%)",
          color: "#ffffff",
          fontSize: 110,
          fontWeight: 800,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: -4,
        }}
      >
        N
      </div>
    ),
    { ...size }
  );
}
