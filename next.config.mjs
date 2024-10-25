const isProd = process.env.NODE_ENV === 'production'
const prefixPath = !isProd ? '/sub-derectory' : ''
/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    assetPrefix: prefixPath,
    basePath: prefixPath,
    reactStrictMode: true
  };

export default nextConfig;
