// import "./app/env";
import path from "path"
import { fileURLToPath } from "url"
import createNextIntlPlugin from "next-intl/plugin"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.resolve(__dirname, "../.."),
  transpilePackages: ["@workspace/ui"],
  turbopack: {
    root: path.resolve(__dirname, "../.."),
  },
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:8000"
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
