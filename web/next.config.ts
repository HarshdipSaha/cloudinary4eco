import type { NextConfig } from "next";

const config: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default config;
