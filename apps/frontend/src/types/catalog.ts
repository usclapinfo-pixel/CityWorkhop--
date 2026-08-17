export interface ApplianceType {
  id: string;
  name: string;
  code: string;
  category?: string;
  iconReference?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface ServiceCategorySummary {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface ServiceOffering {
  id: string;
  applianceTypeId: string;
  serviceCategoryId: string;
  name: string;
  code: string;
  description?: string;
  requiresInspection: boolean;
  estimatedDurationMinutes?: number;
  isActive: boolean;
  displayOrder: number;
  serviceCategory?: ServiceCategorySummary;
}

/** Narrow public projection returned by the guest cities endpoint; not the full admin City record. */
export interface PublicCity {
  id: string;
  name: string;
  state: string;
  district: string;
}
