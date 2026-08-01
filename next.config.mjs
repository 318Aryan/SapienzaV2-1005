/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Clerk avatar URLs (student/teacher profile photos, e.g. on
    // /teacher/students/[studentId]) are served from these hosts — next/image
    // refuses any remote host that isn't explicitly allowlisted here.
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: [
      // @libsql/client's underlying `libsql` package ships a native binary —
      // without this, Next's webpack bundler tries (and fails) to bundle it
      // like regular JS.
      "@libsql/client",
      "libsql",
      // pdf-parse pulls in pdfjs-dist (which loads a worker via a dynamic
      // require) and an optional native `@napi-rs/canvas` binary. Webpack
      // can't statically bundle either, and the broken bundling attempt
      // surfaces as "Object.defineProperty called on non-object" at import
      // time — excluding them from the server bundle lets Node's own
      // require/import handle them correctly instead.
      "pdf-parse",
      "pdfjs-dist",
      "@napi-rs/canvas",
    ],
  },
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Content-Range",
            value: "bytes : 0-9/*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
