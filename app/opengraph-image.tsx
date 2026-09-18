import { ImageResponse } from "next/og"

export const dynamic = "force-static"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
          Visualise. Focus. Achieve.
        </div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 28, color: "#93c5fd" }}>
          FocusPie turns chaos into achievement
        </div>
      </div>
    ),
    { ...size }
  )
}
