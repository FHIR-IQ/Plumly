/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    FHIR_SERVER_URL: process.env.FHIR_SERVER_URL,
    NEXT_PUBLIC_FHIR_SERVER_URL: process.env.NEXT_PUBLIC_FHIR_SERVER_URL,
  },
  images: {
    domains: [],
  },
  // For Vercel deployment
  output: 'standalone',
}

module.exports = nextConfig