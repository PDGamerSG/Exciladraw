import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // @repo/common is published as TypeScript source, so Next has to compile it
  // alongside the app rather than treating it as a prebuilt dependency
  transpilePackages: ["@repo/common"],
};

export default nextConfig;
