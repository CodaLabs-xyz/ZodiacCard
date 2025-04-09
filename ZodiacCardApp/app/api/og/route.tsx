import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const username = searchParams.get("username") || "User"
    const sign = searchParams.get("sign") || "Zodiac"
    const fortune = searchParams.get("fortune") || "Your crypto journey looks promising!"
    const characterImage = searchParams.get("image")

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#2D1B69",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #3B2283 2%, transparent 0%), radial-gradient(circle at 75px 75px, #3B2283 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          fontFamily: "sans-serif",
          padding: "40px 50px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "20px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "40px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
            width: "90%",
            maxWidth: "800px",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#fff",
              marginBottom: "10px",
              textAlign: "center",
            }}
          >
            <span style={{ color: "#C4B5FD" }}>Zoda</span> Fortune
          </h1>

          {characterImage && (
            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "100px",
                overflow: "hidden",
                marginBottom: "20px",
                border: "4px solid #C4B5FD",
              }}
            >
              <img
                src={characterImage || "/placeholder.svg"}
                width="200"
                height="200"
                style={{ objectFit: "cover" }}
                alt={`${sign} Character`}
              />
            </div>
          )}

          <div
            style={{
              fontSize: "24px",
              color: "#C4B5FD",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            {username}'s {sign} Fortune
          </div>
          <div
            style={{
              fontSize: "28px",
              color: "#fff",
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 1.4,
              padding: "20px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: "10px",
              border: "1px solid rgba(196, 181, 253, 0.2)",
              maxWidth: "700px",
            }}
          >
            "{fortune}"
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e) {
    console.log(`${e}`)
    return new Response(`Failed to generate the image`, {
      status: 500,
    })
  }
}
