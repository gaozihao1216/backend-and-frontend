import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { PageConfig } from "../objects/ui-customization/ui-customization-objects.js";
import { hydratePageConfigVisualAssets } from "../lib/hydrate-page-config-visual-assets.js";
import { getSharedLevelMapPageConfig } from "../lib/shared-level-map-page.js";
import {
  getPageConfigRevision,
  subscribePageConfigStore,
} from "../lib/ui-customization.js";

export const useSharedLevelMapPageConfig = (): PageConfig | null => {
  const pageConfigRevision = useSyncExternalStore(
    subscribePageConfigStore,
    getPageConfigRevision,
    getPageConfigRevision,
  );
  const basePage = useMemo(
    () => getSharedLevelMapPageConfig(),
    [pageConfigRevision],
  );
  const [hydratedByRevision, setHydratedByRevision] = useState<{
    revision: number;
    page: PageConfig;
  } | null>(null);

  useEffect(() => {
    if (!basePage) {
      setHydratedByRevision(null);
      return;
    }

    let cancelled = false;

    void hydratePageConfigVisualAssets(basePage).then((hydratedPage) => {
      if (!cancelled) {
        setHydratedByRevision({ revision: pageConfigRevision, page: hydratedPage });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [basePage, pageConfigRevision]);

  if (!basePage) {
    return null;
  }

  if (hydratedByRevision?.revision === pageConfigRevision) {
    return hydratedByRevision.page;
  }

  return basePage;
};
