import { ImageResponse } from "next/og";
import { siteUrl } from "@/lib/site";

export const runtime = "edge";
export const alt = "Nikhil Chavan - Full Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const siteName = new URL(siteUrl).hostname;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0b0b12 0%, #1a1033 50%, #2a0f3d 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: 28,
            color: "#c4b5fd",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              background:
                "linear-gradient(90deg, #a855f7, #ec4899)",
            }}
          />
          Portfolio
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Nikhil Chavan
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 600,
              backgroundImage:
                "linear-gradient(90deg, #a855f7, #8b5cf6, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Full Stack Developer
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 16,
              fontSize: 26,
              color: "#d4d4d8",
            }}
          >
            <span>Next.js</span>
            <span style={{ color: "#71717a" }}>•</span>
            <span>React</span>
            <span style={{ color: "#71717a" }}>•</span>
            <span>TypeScript</span>
            <span style={{ color: "#71717a" }}>•</span>
            <span>Node.js</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            fontSize: 26,
            color: "#a1a1aa",
          }}
        >
          <span>{siteName}</span>
          <span>Projects · Blog · Experience</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
