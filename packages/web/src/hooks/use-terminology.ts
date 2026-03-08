import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  terminologyConfigs,
  getTerminology,
  type BusinessTypeKey,
  type TerminologyConfig,
} from "@/lib/terminology";

/**
 * Type for the API business type response
 */
interface BusinessType {
  id: string;
  name: string;
  key: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

/**
 * Type for profile including business type
 */
interface ProfileWithBusinessType {
  id: string;
  username: string;
  displayName: string;
  title?: string;
  bio?: string;
  whatsappNumber?: string;
  avatarId?: string;
  coverImageId?: string;
  isOrganization?: boolean;
  businessName?: string;
  businessTypeId?: string;
  businessType?: BusinessType;
  [key: string]: unknown;
}

/**
 * Hook to get terminology based on current profile's business type
 * 
 * Usage:
 * const { terminology, isLoading } = useTerminology();
 * 
 * // Then use terminology.customer, terminology.service, etc.
 * <h1>Bienvenido, {terminology.customer}</h1>
 */
export function useTerminology() {
  // Fetch business types
  const { data: businessTypes = [], isLoading: isLoadingBusinessTypes } = useQuery({
    queryKey: ["business-types"],
    queryFn: async () => {
      const { data, error } = await api.api["business-types"].get();
      if (error) {
        console.error("Error fetching business types:", error);
        return [];
      }
      return data as BusinessType[];
    },
  });

  // Fetch profiles to get current profile's business type
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await api.api.profiles.get();
      if (error) {
        console.error("Error fetching profiles:", error);
        return [];
      }
      return data as ProfileWithBusinessType[];
    },
  });

  // Get current profile (first one)
  const profile = profiles[0] as ProfileWithBusinessType | undefined;

  // Determine business type key
  const businessTypeKey = useMemo((): BusinessTypeKey => {
    // First try to get from profile's businessType relation
    if (profile?.businessType?.key) {
      return profile.businessType.key as BusinessTypeKey;
    }
    
    // Try to find business type by ID from businessTypes list
    if (profile?.businessTypeId && businessTypes.length > 0) {
      const foundType = businessTypes.find(
        (bt) => bt.id === profile.businessTypeId
      );
      if (foundType?.key) {
        return foundType.key as BusinessTypeKey;
      }
    }
    
    // Default to beauty
    return "beauty";
  }, [profile, businessTypes]);

  // Get terminology config based on business type
  const terminology = useMemo((): TerminologyConfig => {
    return getTerminology(businessTypeKey);
  }, [businessTypeKey]);

  // Check if loading
  const isLoading = isLoadingBusinessTypes || isLoadingProfiles;

  return {
    terminology,
    businessTypeKey,
    businessType: profile?.businessType,
    isLoading,
    // Expose raw data for advanced use cases
    businessTypes,
    profile,
  };
}

/**
 * Hook to get terminology for a specific business type
 * Useful when you need terminology for a different business type than the current profile
 */
export function useTerminologyForType(key: BusinessTypeKey | string | undefined) {
  return useMemo(() => {
    return getTerminology(key);
  }, [key]);
}

/**
 * Hook to get all available terminology configs
 * Useful for settings or admin interfaces
 */
export function useAllTerminologies() {
  return terminologyConfigs;
}
