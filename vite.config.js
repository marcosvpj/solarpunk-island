import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Determine base path - for GitHub Pages it should be the repository name
  // This will be overridden by the build:gh-pages script
  const base =
    process.env.GITHUB_PAGES === "true"
      ? process.env.GITHUB_REPOSITORY?.split("/")[1]
        ? `/${process.env.GITHUB_REPOSITORY.split("/")[1]}/`
        : "/solarpunk-island/"
      : "/";

  return {
    base,
    server: {
      port: 8080,
      open: false,
      host: true,
    },
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["*.png", "*.ico", "*.svg"],
        manifest: {
          name: "Floating Islands - Hex Strategy Game",
          short_name: "Floating Islands",
          description:
            "A browser-based hexagonal grid strategy game with building placement and resource management",
          theme_color: "#00bcd4",
          background_color: "#0a1420",
          display: "standalone",
          orientation: "any",
          start_url: base,
          scope: base,
          icons: [
            {
              src: `${base}icons/icon-192x192.png`,
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: `${base}icons/icon-512x512.png`,
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: `${base}icons/icon-512x512.png`,
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
  };
});
