// FHIR parsing utilities
import type { FHIRBundle, FHIRResource } from './types';

export function extractResources(bundle: FHIRBundle): FHIRResource[] {
  return bundle.entry?.map(entry => entry.resource).filter(Boolean) as FHIRResource[] || [];
}

export function getResourcesByType(bundle: FHIRBundle, resourceType: string): FHIRResource[] {
  const resources = extractResources(bundle);
  return resources.filter(resource => resource.resourceType === resourceType);
}