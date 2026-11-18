import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  // Do not generate AGENTS.md / agent rule files in the repository.
  agentRules: false,
};

export default nextConfig;
