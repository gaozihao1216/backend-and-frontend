import { useEffect, useState } from "react";
import {
  getDefaultGroundMaterialRenderConfig,
  setGroundMaterialRenderConfig,
  type GroundMaterialRenderConfig,
} from "../../../game/draw-scene.js";
import {
  DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG,
  getDefaultBoundaryBreakpointEpsilon,
  setBoundaryBreakpointEpsilon,
  type GroundStrokeSimplifyConfig,
} from "../../../lib/ground.js";
import {
  sanitizeBoundaryBreakpointEpsilon,
  sanitizeGroundMaterialRenderConfig,
  sanitizeGroundStrokeSimplifyConfig,
} from "../functions/ground-tuning-functions.js";
import type { DesignerGroundTuningStorage } from "../objects/designer-page-types.js";

export const DESIGNER_GROUND_TUNING_STORAGE_KEY = "ugc-level-platform.designer-ground-tuning.v1";

export const useDesignerGroundTuning = () => {
  const [groundStrokeSimplifyConfig, setGroundStrokeSimplifyConfig] = useState<GroundStrokeSimplifyConfig>(
    DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG,
  );
  const [boundaryBreakpointEpsilon, setBoundaryBreakpointEpsilonState] = useState(getDefaultBoundaryBreakpointEpsilon());
  const [groundMaterialRenderConfig, setGroundMaterialRenderConfigState] = useState<GroundMaterialRenderConfig>(
    getDefaultGroundMaterialRenderConfig(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(DESIGNER_GROUND_TUNING_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as DesignerGroundTuningStorage;
      setGroundStrokeSimplifyConfig(sanitizeGroundStrokeSimplifyConfig(parsed));
      const nextBreakpointEpsilon = sanitizeBoundaryBreakpointEpsilon(parsed.breakpointEpsilon);
      setBoundaryBreakpointEpsilonState(nextBreakpointEpsilon);
      setBoundaryBreakpointEpsilon(nextBreakpointEpsilon);
      const nextRenderConfig = sanitizeGroundMaterialRenderConfig(parsed.renderConfig);
      setGroundMaterialRenderConfigState(nextRenderConfig);
      setGroundMaterialRenderConfig(nextRenderConfig);
    } catch {
      setGroundStrokeSimplifyConfig(DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG);
      const nextBreakpointEpsilon = getDefaultBoundaryBreakpointEpsilon();
      setBoundaryBreakpointEpsilonState(nextBreakpointEpsilon);
      setBoundaryBreakpointEpsilon(nextBreakpointEpsilon);
      const nextRenderConfig = getDefaultGroundMaterialRenderConfig();
      setGroundMaterialRenderConfigState(nextRenderConfig);
      setGroundMaterialRenderConfig(nextRenderConfig);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      DESIGNER_GROUND_TUNING_STORAGE_KEY,
      JSON.stringify({
        ...groundStrokeSimplifyConfig,
        breakpointEpsilon: boundaryBreakpointEpsilon,
        renderConfig: groundMaterialRenderConfig,
      } satisfies DesignerGroundTuningStorage),
    );
  }, [groundStrokeSimplifyConfig, boundaryBreakpointEpsilon, groundMaterialRenderConfig]);

  useEffect(() => {
    setBoundaryBreakpointEpsilon(boundaryBreakpointEpsilon);
  }, [boundaryBreakpointEpsilon]);

  useEffect(() => {
    setGroundMaterialRenderConfig(groundMaterialRenderConfig);
  }, [groundMaterialRenderConfig]);

  const updateGroundStrokeSimplifyConfig = (
    key: keyof GroundStrokeSimplifyConfig,
    rawValue: number,
  ) => {
    setGroundStrokeSimplifyConfig((current) =>
      sanitizeGroundStrokeSimplifyConfig({
        ...current,
        [key]: rawValue,
      }),
    );
  };

  const updateBoundaryBreakpointEpsilon = (rawValue: number) => {
    setBoundaryBreakpointEpsilonState(sanitizeBoundaryBreakpointEpsilon(rawValue));
  };

  const updateGroundMaterialRenderConfig = (
    key: keyof GroundMaterialRenderConfig,
    rawValue: number,
  ) => {
    setGroundMaterialRenderConfigState((current) =>
      sanitizeGroundMaterialRenderConfig({
        ...current,
        [key]: rawValue,
      }),
    );
  };

  return {
    groundStrokeSimplifyConfig,
    setGroundStrokeSimplifyConfig,
    boundaryBreakpointEpsilon,
    setBoundaryBreakpointEpsilonState,
    groundMaterialRenderConfig,
    setGroundMaterialRenderConfigState,
    updateGroundStrokeSimplifyConfig,
    updateBoundaryBreakpointEpsilon,
    updateGroundMaterialRenderConfig,
  };
};
