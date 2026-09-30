import type { NextConfig } from "next";

const config: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  serverExternalPackages: ["@electric-sql/pglite"],
  // The Trust page reads the evaluation corpus and results from disk at request time.
  outputFileTracingIncludes: { "/trust": ["./calibration/**/*"] },
};

export default config;
