import { useEffect, useMemo, useState } from "react";
import { getLevelBackgroundTemplate } from "../../../lib/level-background-template-store.js";
import { resolveLevelBackgroundDesignsForRender } from "../../../lib/level-background-template-render.js";
import type { LevelBackgroundTemplate } from "../../../objects/level/level-background-template.js";
import type { StretchVisualDesign } from "../../../objects/ui-customization/ui-customization-objects.js";
import { useDirectorTemplateLibrary } from "./useDirectorTemplateLibrary.js";

type ResolvedLevelBackground = {
  template: LevelBackgroundTemplate;
  panelBackgroundDesign: StretchVisualDesign | null;
  cloudPatternDesigns: StretchVisualDesign[];
};

export const useLevelBackgroundTemplateResolution = (
  templateId: string | undefined,
  userId: string,
) => {
  const { panelTemplates, patternTemplates, loading: libraryLoading, error: libraryError } =
    useDirectorTemplateLibrary(userId);
  const panelTemplateMap = useMemo(
    () => new Map(panelTemplates.map((template) => [template.id, template])),
    [panelTemplates],
  );
  const patternTemplateMap = useMemo(
    () => new Map(patternTemplates.map((template) => [template.id, template])),
    [patternTemplates],
  );
  const template = useMemo(
    () => (templateId ? getLevelBackgroundTemplate(templateId) : null),
    [templateId],
  );
  const [resolved, setResolved] = useState<ResolvedLevelBackground | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");

  useEffect(() => {
    if (!template) {
      setResolved(null);
      setResolveError("");
      return;
    }

    let cancelled = false;
    setResolving(true);
    setResolveError("");

    void resolveLevelBackgroundDesignsForRender(template, panelTemplateMap, patternTemplateMap)
      .then((designs) => {
        if (cancelled) {
          return;
        }

        setResolved({
          template,
          panelBackgroundDesign: designs.panelBackgroundDesign,
          cloudPatternDesigns: designs.cloudPatternDesigns,
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setResolved({
            template,
            panelBackgroundDesign: null,
            cloudPatternDesigns: [],
          });
          setResolveError(error instanceof Error ? error.message : "背景模板资源解析失败。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [template, panelTemplateMap, patternTemplateMap]);

  return {
    template,
    panelBackgroundDesign: resolved?.panelBackgroundDesign ?? null,
    cloudPatternDesigns: resolved?.cloudPatternDesigns ?? [],
    loading: libraryLoading || resolving,
    error: libraryError || resolveError,
  };
};
