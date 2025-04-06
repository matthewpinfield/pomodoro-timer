import type { MetadataRoute } from "next"

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FocusPie - ADHD-Friendly Focus Timer",
    short_name: "FocusPie",
    description: "A visual focus timer application designed for individuals with ADHD",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#f9fafb",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}

