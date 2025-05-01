import { OrganizationCategory } from '../types/organization.interface';
import {
  TerminologyConfiguration,
  TerminologyKey,
} from '../types/terminology.interface';

/**
 * Creates a terminology resolver function bound to a specific configuration
 * @param config The terminology configuration
 * @returns A function that resolves terminology
 */
export const createTerminologyResolver = (
  config: TerminologyConfiguration
): ((key: TerminologyKey, category: OrganizationCategory) => string) => {
  return (key: TerminologyKey, category: OrganizationCategory): string => {
    // Find the mapping for the given key
    const mapping = config.mappings.find((m) => m.key === key);

    // If no mapping is found, return the key as a fallback
    if (!mapping) {
      return key.toString();
    }

    // If there's a category-specific mapping, use it
    if (mapping.mappings[category]) {
      return mapping.mappings[category]!;
    }

    // Otherwise, use the default term
    return mapping.defaultTerm;
  };
};
