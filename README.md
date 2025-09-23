# Plumly - FHIR Data Summarization POC

A proof-of-concept application that demonstrates how FHIR healthcare data can be ingested, structured, and summarized into meaningful clinical or patient-centric outputs using Claude AI.

## 🎯 Purpose

Showcase LLM-driven FHIR data workflows for:
- **Patients**: Receiving simplified health summaries
- **Providers/Pharmacists**: Consuming structured clinical summaries
- **Payers/Health Systems**: Using summarized data for quality measures and reporting

## ✨ Key Features

- 📁 **FHIR Bundle Upload**: Support for uploading JSON FHIR bundles
- 🧠 **AI-Powered Summarization**: Claude API integration for narrative generation
- 🎛️ **Configurable Prompts**: Multiple templates for different audiences
- 📊 **Multiple Output Formats**: Narrative, structured, and FHIR Composition outputs
- 💾 **Export Options**: Download as TXT, JSON, or FHIR resources
- 🏥 **HAPI FHIR Integration**: Lightweight FHIR server for data storage

## 🏗️ Architecture

```
[React/Next.js Frontend]
   ↓
[Upload/Configuration UI]
   ↓
[Claude API Integration]
   ↓
[FHIR Composition Generator]
   ↓
[HAPI FHIR Server (Docker)]
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Anthropic API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd plumly
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your Anthropic API key
   ANTHROPIC_API_KEY=your_api_key_here
   ```

3. **Start the HAPI FHIR server:**
   ```bash
   docker-compose up -d
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000)

## 📋 Usage

1. **Upload FHIR Bundle**: Drop a JSON file containing a FHIR Bundle
2. **Configure Prompt**: Select audience, format, and focus areas
3. **Generate Summary**: Click to create AI-powered summary
4. **Download Output**: Export as text, JSON, or FHIR Composition

## 🎭 Prompt Templates

### Patient-Friendly Summary
- Simple, easy-to-understand language
- Avoids medical jargon
- Focuses on actionable information

### Clinical Summary for Providers
- Medical terminology and clinical details
- Structured format with clear sections
- Treatment recommendations

### Payer Utilization Summary
- Cost-effectiveness focus
- Quality metrics and care gaps
- Risk stratification

## 📊 Supported FHIR Resources

- **Patient**: Demographics and basic information
- **Observation**: Lab results, vital signs, assessments
- **Condition**: Diagnoses and health conditions
- **MedicationRequest**: Prescribed medications
- **Encounter**: Healthcare visits and interactions

## 🔧 API Endpoints

### Upload FHIR Bundle
```
POST /api/fhir/upload
Content-Type: application/json

{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [...]
}
```

### Generate Summary
```
POST /api/summarize
Content-Type: application/json

{
  "bundle": { FHIR Bundle },
  "options": {
    "targetAudience": "patient|provider|payer",
    "outputFormat": "narrative|structured|composition",
    "includeRecommendations": true,
    "focusAreas": ["diabetes", "medications"]
  }
}
```

### Generate FHIR Composition
```
POST /api/compose
Content-Type: application/json

{
  "bundle": { FHIR Bundle },
  "summary": "Generated summary text",
  "metadata": { timestamp, options, resourceCounts },
  "outputType": "composition|document-reference|list"
}
```

## 📁 Sample FHIR Bundle

```json
{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "patient-1",
        "name": [{"given": ["John"], "family": "Doe"}],
        "gender": "male",
        "birthDate": "1980-01-01"
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "id": "condition-1",
        "subject": {"reference": "Patient/patient-1"},
        "code": {
          "coding": [{
            "system": "http://snomed.info/sct",
            "code": "44054006",
            "display": "Diabetes mellitus type 2"
          }]
        },
        "onsetDateTime": "2020-03-15"
      }
    }
  ]
}
```

## 🔒 Security & Privacy

- **Local Deployment**: All processing happens locally
- **Test Data Only**: Designed for demo/test data, not production PHI
- **No Data Persistence**: Summaries are not stored permanently
- **API Key Security**: Claude API key stored in environment variables

## 🛠️ Development

### Project Structure
```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   └── page.tsx        # Main application page
├── components/         # React components
├── lib/               # Utility libraries
│   ├── claude-client.ts
│   ├── fhir-client.ts
│   └── fhir-composition.ts
└── types/             # TypeScript type definitions
```

### Key Components
- **FileUpload**: FHIR bundle upload with validation
- **PromptConfiguration**: Template and option selection
- **SummaryOutput**: Display and export functionality

### Libraries Used
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first CSS framework
- **@anthropic-ai/sdk**: Claude API integration
- **Docker**: HAPI FHIR server containerization

## 📈 Performance Targets

- **Time to Summary**: < 5s response time
- **Accuracy**: >80% match between narrative and FHIR resources
- **Scalability**: Support up to 1k resources per patient

## 🔄 Future Enhancements

### Phase 2: Advanced Features
- [ ] DocumentReference and List output formats
- [ ] Prompt configuration UI with custom templates
- [ ] Historical summary storage and comparison

### Phase 3: Validation & Testing
- [ ] Sample patient data and test cases
- [ ] Accuracy validation against source bundles
- [ ] User feedback collection system

### Phase 4: Production Readiness
- [ ] Authentication and authorization
- [ ] Audit logging and compliance
- [ ] Performance monitoring and optimization

## 🤝 Contributing

This is a proof-of-concept application. For production use:
1. Implement proper security measures
2. Add comprehensive error handling
3. Include audit logging
4. Validate against FHIR specifications
5. Test with real-world data scenarios

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This application is for demonstration purposes only. Do not use with real patient health information (PHI) or in production healthcare environments without proper security, compliance, and validation measures.