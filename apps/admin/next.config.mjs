/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  assetPrefix: process.env.NODE_ENV === "development" ? "http://localhost:3001" : "",
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/v1/:path*` }];
  },
};
export default nextConfig;
