/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }]
      },
      {
        source: "/offline.html",
        headers: [{ key: "Cache-Control", value: "no-cache" }]
      },
      {
        source: "/(.*)\\.(js|css|png|jpg|jpeg|svg|webp|ico)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      }
    ];
  }
};

export default nextConfig;
