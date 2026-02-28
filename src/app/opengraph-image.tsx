import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Git Tree Visualizer | 3D GitHub Repository Topology";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#020617",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        position: "relative",
        padding: "80px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-150px",
          right: "-150px",
          width: "600px",
          height: "600px",
          background: "rgba(79, 70, 229, 0.08)",
          filter: "blur(100px)",
          borderRadius: "50%",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "40px",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "180px",
            height: "180px",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "40px",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M50 85V15"
              stroke="#6366f1"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M50 60C65 60 75 50 75 35"
              stroke="#3b82f6"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M50 45C35 45 25 35 25 20"
              stroke="#60a5fa"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="85"
              r="6"
              fill="#1e1b4b"
              stroke="#6366f1"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="60"
              r="6"
              fill="#1e1b4b"
              stroke="#6366f1"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="40"
              r="6"
              fill="#1e1b4b"
              stroke="#6366f1"
              strokeWidth="3"
            />
            <circle cx="50" cy="15" r="6" fill="#6366f1" />
            <circle cx="75" cy="35" r="5" fill="#3b82f6" />
            <circle cx="25" cy="20" r="5" fill="#60a5fa" />
          </svg>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: "900",
              letterSpacing: "-0.05em",
              color: "white",
              lineHeight: "1",
            }}
          >
            Git Tree Visualizer
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#94a3b8",
              fontWeight: "400",
              maxWidth: "600px",
              lineHeight: "1.4",
            }}
          >
            Structural intelligence for repository histories. Map your topology
            in immersive 3D.
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "60px",
          left: "80px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "14px",
          color: "#475569",
          fontFamily: "monospace",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          fontWeight: "bold",
        }}
      >
        <div style={{ width: "40px", height: "1px", background: "#1e293b" }} />
        Spatial_Projection_Engine_v0.1
      </div>
    </div>,
    {
      ...size,
    },
  );
}
