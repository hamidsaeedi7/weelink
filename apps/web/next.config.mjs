/** @type {import('next').NextConfig} */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const nextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: { serverComponentsExternalPackages: ["isomorphic-dompurify"] },
  webpack: (config) => {
    // Konva ships a node build that requires the native `canvas` package for
    // server-side rendering. The story studio only ever runs client-side
    // (dynamic import with ssr:false), but webpack still walks the module
    // graph and fails to resolve it. Aliasing to false drops that branch.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
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
    const rules = [
      {
        source: "/:slug/opengraph-image",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
    // /_next/static chunk filenames are content-hashed only in production builds;
    // in `next dev` they're stable, so immutable caching here serves stale JS forever.
    if (process.env.NODE_ENV === "production") {
      rules.push({
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      });
    }
    return rules;
  },
};
export default nextConfig;
