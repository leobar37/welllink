import { useQuery } from "@tanstack/react-query";

async function fetchAssetUrl(assetId: string) {
  const response = await fetch(`http://localhost:5300/api/assets/${assetId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.status}`);
  }

  const data = await response.json();
  return data.url as string;
}

export function useAssetUrl(assetId?: string | null) {
  return useQuery({
    queryKey: ["asset-url", assetId],
    queryFn: () => assetId ? fetchAssetUrl(assetId) : Promise.resolve(null),
    enabled: !!assetId,
    staleTime: Infinity, // Asset URLs don't change
  });
}