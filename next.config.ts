import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ビルド時のESLintを無効化
    ignoreDuringBuilds: true,
  },
  typescript: {
    // TypeScriptエラーも無視（オプション）
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
