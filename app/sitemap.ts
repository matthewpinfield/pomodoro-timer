import type { MetadataRoute } from "next"

export const dynamic = "force-static"

const BASE_URL = "https://focuspie.app"
const ROUTES = ["", "pie-chart", "timer", "alarms", "calendar", "account"]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return ROUTES.map((route) => ({
    url: route ? `${BASE_URL}/${route}/` : `${BASE_URL}/`,
    lastModified,
  }))
}
