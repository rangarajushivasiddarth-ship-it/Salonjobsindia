/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: false,
  swcMinify: true,
}

export default nextConfig
