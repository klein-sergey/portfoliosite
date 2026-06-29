import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? "/portfoliosite" : "",
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: isGithubPages ? "/portfoliosite" : "",
  assetPrefix: isGithubPages ? "/portfoliosite/" : undefined,
};

export default nextConfig;
