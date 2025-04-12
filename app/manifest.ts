import type { MetadataRoute } from "next"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  
  return {
    name: "FocusPie - ADHD-Friendly Focus Timer",
    short_name: "FocusPie",
    description: "A visual focus timer application designed for individuals with ADHD",
    start_url: basePath + "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#4299e1",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
    ],
  }
}

