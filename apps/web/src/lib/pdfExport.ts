interface ClaimsReference {
  claim: string
  references: string[]
  resourceType: string
  resourceId: string
}

interface PDFExportOptions {
  includeClaimsAppendix?: boolean
  watermarkText?: string
  title?: string
}

/**
 * Extract claims and their references from summary data
 */
export function extractClaimsReferences(summaryData: any, reviewItems: any[] = []): ClaimsReference[] {
  const claimsRefs: ClaimsReference[] = []

  if (!summaryData) return claimsRefs

  // Extract from summary sections
  if (summaryData.sections) {
    summaryData.sections.forEach((section: any) => {
      if (section.content && section.resourceRefs) {
        // Split content into sentences/claims
        const sentences = section.content
          .split(/[.!?]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 10)

        sentences.forEach((sentence: string) => {
          if (section.resourceRefs.length > 0) {
            claimsRefs.push({
              claim: sentence,
              references: section.resourceRefs,
              resourceType: section.resourceType || 'Mixed',
              resourceId: section.id || 'unknown'
            })
          }
        })
      }
    })
  }

  // Extract from review items
  reviewItems.forEach((item: any) => {
    if (item.description && item.resourceRef) {
      claimsRefs.push({
        claim: item.description,
        references: [item.resourceRef],
        resourceType: item.resourceType || 'ReviewItem',
        resourceId: item.resourceRef
      })
    }
  })

  return claimsRefs
}

/**
 * Generate PDF-friendly HTML content
 */
export function generatePDFHTML(
  summaryData: any,
  reviewItems: any[] = [],
  options: PDFExportOptions = {}
): string {
  const {
    includeClaimsAppendix = false,
    watermarkText = 'Demo – Not for clinical use',
    title = 'Clinical Summary Report'
  } = options

  const claimsRefs = includeClaimsAppendix ? extractClaimsReferences(summaryData, reviewItems) : []
  const currentDate = new Date().toLocaleDateString()

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
      padding: 1in;
      position: relative;
    }

    /* Watermark */
    body::before {
      content: '${watermarkText.toUpperCase()}';
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(45deg);
      font-size: 48px;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.05);
      z-index: -1;
      pointer-events: none;
      white-space: nowrap;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
    }

    .disclaimer {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 16px;
      margin: 20px 0;
      color: #b91c1c;
    }

    .disclaimer strong {
      display: block;
      margin-bottom: 8px;
      font-size: 16px;
    }

    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .section h2 {
      font-size: 18px;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    .section h3 {
      font-size: 16px;
      color: #374151;
      margin: 16px 0 8px 0;
    }

    .review-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .review-item.high {
      border-color: #dc2626;
      background: #fef2f2;
    }

    .review-item.medium {
      border-color: #d97706;
      background: #fffbeb;
    }

    .severity {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .severity.high {
      background: #dc2626;
      color: white;
    }

    .severity.medium {
      background: #d97706;
      color: white;
    }

    .severity.low {
      background: #059669;
      color: white;
    }

    .claims-appendix {
      page-break-before: always;
      margin-top: 40px;
    }

    .claims-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-top: 16px;
    }

    .claims-table th,
    .claims-table td {
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }

    .claims-table th {
      background: #f3f4f6;
      font-weight: 600;
    }

    .claims-table .claim-cell {
      max-width: 300px;
      word-wrap: break-word;
    }

    .claims-table .refs-cell {
      font-family: monospace;
      font-size: 10px;
      color: #6b7280;
    }

    .footer {
      position: fixed;
      bottom: 0.5in;
      left: 1in;
      right: 1in;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
    }

    @page {
      margin: 1in;
      size: letter;
    }

    @media print {
      body {
        padding: 0;
      }

      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <h1>${title}</h1>
    <div class="subtitle">Generated on ${currentDate} • AI-Powered Clinical Summary</div>
  </div>

  <!-- Disclaimer -->
  <div class="disclaimer">
    <strong>⚠️ Demo Mode - Not for Clinical Use</strong>
    This is a demonstration report with sanitized data. All patient information has been anonymized.
    This tool is for demonstration purposes only and should not be used for actual clinical decision-making.
    All AI-generated content should be reviewed by qualified healthcare professionals.
  </div>

  <!-- Review Items Section -->
  ${reviewItems.length > 0 ? `
  <div class="section">
    <h2>Clinical Review Items</h2>
    ${reviewItems.map(item => `
      <div class="review-item ${item.severity || 'medium'}">
        <span class="severity ${item.severity || 'medium'}">${(item.severity || 'medium').toUpperCase()}</span>
        <h3>${item.title || 'Clinical Finding'}</h3>
        <p><strong>Description:</strong> ${item.description || 'No description available'}</p>
        ${item.recommendation ? `<p><strong>Recommendation:</strong> ${item.recommendation}</p>` : ''}
        ${item.resourceRef ? `<p><strong>Reference:</strong> <code>${item.resourceRef}</code></p>` : ''}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Summary Content -->
  ${summaryData ? `
  <div class="section">
    <h2>AI-Generated Summary</h2>
    ${summaryData.sections ? summaryData.sections.map((section: any) => `
      <div>
        <h3>${section.title || 'Clinical Section'}</h3>
        <p>${section.content || 'No content available'}</p>
        ${section.resourceRefs && section.resourceRefs.length > 0 ? `
          <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
            <strong>References:</strong> ${section.resourceRefs.join(', ')}
          </p>
        ` : ''}
      </div>
    `).join('') : '<p>No summary content available</p>'}
  </div>
  ` : ''}

  <!-- Claims Reference Appendix -->
  ${includeClaimsAppendix && claimsRefs.length > 0 ? `
  <div class="claims-appendix section">
    <h2>Claims Reference Appendix</h2>
    <p style="margin-bottom: 16px; font-size: 14px; color: #6b7280;">
      This appendix provides a detailed mapping of clinical claims to their supporting FHIR resource references.
    </p>

    <table class="claims-table">
      <thead>
        <tr>
          <th style="width: 50%;">Clinical Claim</th>
          <th style="width: 25%;">Resource Type</th>
          <th style="width: 25%;">FHIR References</th>
        </tr>
      </thead>
      <tbody>
        ${claimsRefs.map(ref => `
          <tr>
            <td class="claim-cell">${ref.claim}</td>
            <td>${ref.resourceType}</td>
            <td class="refs-cell">${ref.references.join(', ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <!-- Footer -->
  <div class="footer">
    <div>Generated by Plumly AI Clinical Summarization Platform</div>
    <div>Report ID: ${summaryData?.id || 'N/A'} • Generated: ${currentDate}</div>
  </div>
</body>
</html>
  `
}

/**
 * Trigger browser print with PDF-optimized content
 */
export function printToPDF(
  summaryData: any,
  reviewItems: any[] = [],
  options: PDFExportOptions = {}
) {
  // Create a new window for printing
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check popup blocker settings.')
  }

  // Generate HTML content
  const htmlContent = generatePDFHTML(summaryData, reviewItems, options)

  // Write content and trigger print
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }
}