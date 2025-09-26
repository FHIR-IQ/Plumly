/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    FHIR_SERVER_URL: process.env.FHIR_SERVER_URL || 'https://hapi.fhir.org/baseR4',
    NEXT_PUBLIC_FHIR_SERVER_URL: process.env.NEXT_PUBLIC_FHIR_SERVER_URL || 'https://hapi.fhir.org/baseR4',
  },
  images: {
    domains: [],
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig