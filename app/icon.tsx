import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
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
          background: "#000000",
          borderRadius: "50%",
        }}
      >
        <div
          style={{
            color: "#B8FF00",
            fontSize: 18,
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: -2,
          }}
        >
          NC
        </div>
      </div>
    ),
    { ...size }
  );
}
