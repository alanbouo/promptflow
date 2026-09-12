/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Temporary: decode real component/file names in prod error traces while
  // debugging the React #185 loop on /output. Safe to remove afterwards.
  productionBrowserSourceMaps: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
};

export default nextConfig;
