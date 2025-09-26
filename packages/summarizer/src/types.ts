// Summarizer type definitions
import type { ResourceSelectionResult } from '@plumly/fhir-utils';

export type PersonaType = 'patient' | 'provider' | 'caregiver';

export interface SectionManifest {
  id: string;
  title: string;
  description: string;
  required: boolean;
  enabledByDefault: boolean;
  priority: number;
  conditions?: {
    hasLabValues?: boolean;
    hasChronicConditions?: boolean;
    hasActiveMedications?: boolean;
    hasAbnormalValues?: boolean;
  };
}

export interface PersonaTemplate {
  id: string;
  name: string;
  persona: PersonaType;
  version: string;
  description: string;
  targetAudience: {
    primary: string;
    readingLevel: string;
    clinicalExpertise: 'none' | 'basic' | 'intermediate' | 'expert';
  };
  sections: SectionManifest[];
  promptTemplate: string;
  styleGuidelines: {
    tone: string;
    language: string;
    technicalLevel: string;
    urgencyHandling: string;
    uncertaintyExpression: string;
  };
  abTestVariant?: string;
}

export interface TemplateOptions {
  focusAreas?: string[];
  includeSections?: string[];
  excludeSections?: string[];
  customInstructions?: string;
  enabledSections?: Record<string, boolean>;
}

export interface SummaryRequest {
  resourceData: ResourceSelectionResult;
  persona: PersonaType;
  templateOptions?: TemplateOptions;
  abTestVariant?: string;
}

export interface SummaryResponse {
  summary: string;
  sections: {
    id: string;
    title: string;
    content: string;
    confidence: number;
    sources: string[];
  }[];
  metadata: {
    templateId: string;
    templateVersion: string;
    persona: PersonaType;
    processingTime: number;
    timestamp: string;
    sectionsGenerated: string[];
    abTestVariant?: string;
    readingLevel?: {
      estimated: string;
      fleschScore?: number;
    };
  };
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  readingLevelCheck?: {
    estimated: string;
    meetsTarget: boolean;
    suggestions: string[];
  };
}

// New types for enhanced summarization functionality
export interface NormalizedPatient {
  id: string;
  name: {
    given: string[];
    family: string;
    full: string;
  };
  birthDate: string;
  age?: number;
  gender: 'male' | 'female' | 'other' | 'unknown';
  identifiers: {
    system: string;
    value: string;
    type?: string;
  }[];
  contact?: {
    phone?: string;
    email?: string;
    address?: {
      line: string[];
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

export interface Claim {
  text: string;
  refs: string[];
  confidence: 'low' | 'med' | 'high';
  category?: string;
  priority?: number;
  timestamp?: string;
}

export interface SectionSummary {
  id: string;
  title: string;
  content: string;
  claims: Claim[];
  sources: {
    resourceType: string;
    resourceId: string;
    reference: string;
    relevanceScore: number;
  }[];
  confidence: number;
  metadata: {
    generatedAt: string;
    persona: PersonaType;
    template: string;
    processingTime: number;
  };
}

// Additional supporting types
export interface ResourceSelection {
  labs: {
    id: string;
    code: string;
    display: string;
    value?: string;
    unit?: string;
    status: string;
    date: string;
    isAbnormal: boolean;
    reference?: string;
  }[];
  vitals: {
    id: string;
    code: string;
    display: string;
    value: string;
    unit: string;
    date: string;
    category: 'vital-signs';
  }[];
  meds: {
    id: string;
    code: string;
    display: string;
    status: 'active' | 'inactive' | 'stopped' | 'completed';
    dosage?: string;
    route?: string;
    frequency?: string;
    startDate?: string;
    endDate?: string;
  }[];
  conditions: {
    id: string;
    code: string;
    display: string;
    clinicalStatus: 'active' | 'inactive' | 'resolved' | 'remission';
    verificationStatus: string;
    severity?: string;
    onsetDate?: string;
    isChronic: boolean;
  }[];
  encounters: {
    id: string;
    type: string;
    status: 'planned' | 'arrived' | 'in-progress' | 'finished' | 'cancelled';
    startDate: string;
    endDate?: string;
    provider?: string;
    location?: string;
    reasonCode?: string;
    reasonDisplay?: string;
  }[];
  patient: NormalizedPatient;
}

export interface StructuredSummaryJSON {
  summary: string;
  sections: {
    id: string;
    title: string;
    content: string;
    claims: Claim[];
    confidence: number;
  }[];
  metadata: {
    persona: PersonaType;
    timestamp: string;
    processingTime: number;
    model: string;
    templateUsed: string;
  };
}