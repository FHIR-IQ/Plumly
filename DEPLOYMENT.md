# Plumly Deployment Guide

## Overview

This guide covers deploying Plumly to Vercel for MVP testing and demonstration purposes.

## Prerequisites

- GitHub account
- Vercel account (connected to GitHub)
- Anthropic API key

## Environment Configuration

### Required Environment Variables

For production deployment, the following environment variables must be configured:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here
FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
NEXT_PUBLIC_FHIR_SERVER_URL=https://hapi.fhir.org/baseR4
```

### Public FHIR Server

For the MVP deployment, we use the public HAPI FHIR test server:
- **URL:** https://hapi.fhir.org/baseR4
- **Purpose:** Public testing server for FHIR R4
- **Limitations:** Data is not persistent, shared with other users
- **Security:** Suitable for demo/test data only

## Local Development

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/plumly.git
cd plumly
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.local.example .env.local
# Edit .env.local with your API keys
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Test Application
- Visit http://localhost:3000
- Upload sample data from `sample-data/sample-patient-bundle.json`
- Generate test summary

## Vercel Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

### 2. Connect to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Import the Plumly repository
4. Configure project settings

### 3. Environment Variables
In Vercel dashboard, add these environment variables:

| Name | Value | Type |
|------|-------|------|
| `ANTHROPIC_API_KEY` | Your Claude API key | Secret |
| `FHIR_SERVER_URL` | `https://hapi.fhir.org/baseR4` | Plain Text |
| `NEXT_PUBLIC_FHIR_SERVER_URL` | `https://hapi.fhir.org/baseR4` | Plain Text |

### 4. Deploy
- Vercel will automatically deploy on push to main branch
- Check deployment logs for any errors
- Test the deployed application

## Deployment Architecture

```
Internet
    ↓
Vercel Edge Network
    ↓
Next.js Application
    ↓
External APIs:
├── Claude API (Anthropic)
└── HAPI FHIR Server (hapi.fhir.org)
```

## Testing the Deployment

### 1. Basic Functionality Test
1. Visit your Vercel deployment URL
2. Verify the homepage loads correctly
3. Check that all UI components render

### 2. File Upload Test
1. Upload the sample FHIR bundle
2. Verify file validation works
3. Check error handling for invalid files

### 3. AI Summarization Test
1. Configure prompt options
2. Generate a summary
3. Verify Claude API integration works
4. Test different output formats

### 4. Export Functionality Test
1. Download summary as TXT
2. Download summary as JSON
3. Download summary as FHIR Composition

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Check for TypeScript errors
npm run typecheck

# Check for linting issues
npm run lint

# Test local build
npm run build
```

#### API Connection Issues
- Verify environment variables are set correctly
- Check Anthropic API key is valid
- Confirm FHIR server URL is accessible

#### FHIR Server Issues
- Public HAPI server may have rate limits
- Data uploaded to public server is temporary
- Server may be down for maintenance

### Error Monitoring
- Check Vercel function logs in dashboard
- Monitor API response times
- Watch for rate limiting errors

## Performance Considerations

### Vercel Limits
- **Function Timeout:** 30 seconds (configured)
- **Memory:** 1024MB default
- **Bandwidth:** Generous limits for hobby plans

### Optimization
- Next.js automatically optimizes bundle size
- API routes are serverless functions
- Static assets served from CDN

## Security Notes

### Production Security
- API keys stored as Vercel secrets
- No persistent data storage
- All communications over HTTPS
- Public FHIR server used for demo only

### Data Privacy
- **Demo Data Only:** Never upload real PHI
- **Temporary Storage:** No long-term data persistence
- **Public Server:** HAPI test server is public
- **Logging:** Sensitive data excluded from logs

## Monitoring

### Vercel Analytics
- Built-in analytics for page views and performance
- Function execution logs and errors
- Real-time deployment status

### Application Health
- API endpoint response times
- Error rates and types
- User interaction patterns

## Maintenance

### Regular Tasks
- **Dependencies:** Update npm packages monthly
- **Security:** Monitor for vulnerability alerts
- **API Keys:** Rotate keys quarterly
- **Documentation:** Keep deployment docs current

### Deployment Updates
```bash
# Update dependencies
npm update

# Test locally
npm run build
npm run dev

# Deploy
git add .
git commit -m "Update dependencies"
git push origin main
```

## Scaling Considerations

### Current Limitations
- Single Vercel deployment region
- Shared FHIR server with rate limits
- No authentication or user management

### Future Enhancements
- Multi-region deployment
- Dedicated FHIR server
- User authentication system
- Advanced monitoring and alerting

## Support

### Deployment Issues
- Check Vercel deployment logs
- Review GitHub Actions (if configured)
- Monitor function execution times

### Application Issues
- Test locally first
- Check API integrations
- Verify environment variables

### Getting Help
- GitHub Issues for bug reports
- Vercel documentation for platform issues
- Anthropic support for API issues

---

**Last Updated:** 2024-01-23
**Next Review:** 2024-02-23
**Deployment Status:** MVP Ready