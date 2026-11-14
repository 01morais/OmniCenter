import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OmniCenter", short_name: "OmniCenter", start_url: "/", display: "standalone",
    background_color: "#F7F8F4", theme_color: "#12332E", lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
