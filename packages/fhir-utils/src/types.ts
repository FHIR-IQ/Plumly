// FHIR type definitions
export interface FHIRBundle {
  resourceType: 'Bundle';
  id?: string;
  type: string;
  entry?: FHIRBundleEntry[];
  total?: number;
}

export interface FHIRBundleEntry {
  resource?: FHIRResource;
  fullUrl?: string;
}

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  isFHIRBundle: boolean;
  isIndividualResource: boolean;
  resourceCounts: Record<string, number>;
  totalResources: number;
  errors: string[];
  warnings: string[];
}

export interface FileUploadResult {
  success: boolean;
  data?: FHIRBundle | FHIRResource;
  validation: ValidationResult;
  processingTime: number;
}