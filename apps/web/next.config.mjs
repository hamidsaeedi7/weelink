/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const nextConfig = {
  output: "standalone",
  images: { remotePatterns: [{ protocol: "http", hostname: "localhost" }, { protocol: "https", hostname: "**" }] },
  async rewrites() {
    const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:3001";
    return [
      { source: "/api/v1/:path*",   destination: `${API_URL}/api/v1/:path*` },
      { source: "/uploads/:path*",  destination: `${API_URL}/uploads/:path*` },
      { source: "/admin",           destination: `${ADMIN_URL}/modir` },
      { source: "/admin/:path*",    destination: `${ADMIN_URL}/modir/:path*` },
      { source: "/modir",           destination: `${ADMIN_URL}/modir` },
      { source: "/modir/:path*",    destination: `${ADMIN_URL}/modir/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:slug/opengraph-image",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};
export default nextConfig;
