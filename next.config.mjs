/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/chatwork-like-viewer' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/chatwork-like-viewer/' : '',
};

export default nextConfig;
