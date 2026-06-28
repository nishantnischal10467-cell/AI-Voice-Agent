import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI Voice Agent",
    short_name: "Voice Agent",
    description: "PDF-grounded AI voice support assistant.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3e8",
    theme_color: "#147177",
    icons: [],
  };
}
