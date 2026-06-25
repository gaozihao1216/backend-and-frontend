import { useEffect, useState } from "react";
import { getCachedVisualAsset, loadVisualAsset } from "../../function/ui-config/ui-visual-asset-store.js";

export const useVisualAsset = (
  assetId: string | undefined,
  inlineSourceDataUrl: string | undefined,
): string => {
  const [resolvedSourceDataUrl, setResolvedSourceDataUrl] = useState(() =>
    inlineSourceDataUrl ?? (assetId ? getCachedVisualAsset(assetId) ?? "" : ""),
  );

  useEffect(() => {
    if (inlineSourceDataUrl) {
      setResolvedSourceDataUrl(inlineSourceDataUrl);
      return;
    }

    if (!assetId) {
      setResolvedSourceDataUrl("");
      return;
    }

    const cached = getCachedVisualAsset(assetId);
    if (cached) {
      setResolvedSourceDataUrl(cached);
      return;
    }

    let cancelled = false;
    void loadVisualAsset(assetId).then((sourceDataUrl) => {
      if (!cancelled) {
        setResolvedSourceDataUrl(sourceDataUrl ?? "");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [assetId, inlineSourceDataUrl]);

  return resolvedSourceDataUrl;
};
