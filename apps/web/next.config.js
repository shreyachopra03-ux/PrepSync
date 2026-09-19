/** @type {import('next').NextConfig} */
const apiOrigin = (process.env.API_ORIGIN ?? "http://localhost:8787").replace(/\/+$/, "");

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: "/api/auth/:path*", destination: `${apiOrigin}/api/auth/:path*` },
      { source: "/api/:path*", destination: `${apiOrigin}/:path*` },
    ];
  },
};

module.exports = nextConfig;
