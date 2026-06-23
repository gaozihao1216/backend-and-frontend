import { useCallback, useEffect, useState } from "react";
import {
  listButtonTemplates,
  listStretchVisualTemplates,
} from "../api/index.js";
import type { UiButtonTemplate } from "../api/api-contracts.js";
import type { StretchVisualTemplate } from "../objects/ui/stretch_template/stretch-visual-template.js";

export const useDirectorTemplateLibrary = (userId: string | null) => {
  const [buttonTemplates, setButtonTemplates] = useState<UiButtonTemplate[]>([]);
  const [panelTemplates, setPanelTemplates] = useState<StretchVisualTemplate[]>([]);
  const [patternTemplates, setPatternTemplates] = useState<StretchVisualTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [refreshToken, setRefreshToken] = useState(0);

  const reload = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!userId) {
      setButtonTemplates([]);
      setPanelTemplates([]);
      setPatternTemplates([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      listButtonTemplates(userId),
      listStretchVisualTemplates(userId, "panel"),
      listStretchVisualTemplates(userId, "pattern"),
    ])
      .then(([nextButtonTemplates, nextPanelTemplates, nextPatternTemplates]) => {
        if (cancelled) {
          return;
        }

        setButtonTemplates(nextButtonTemplates);
        setPanelTemplates(nextPanelTemplates);
        setPatternTemplates(nextPatternTemplates);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "模板库加载失败。");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId, refreshToken]);

  return {
    buttonTemplates,
    panelTemplates,
    patternTemplates,
    loading,
    error,
    reload,
  };
};
