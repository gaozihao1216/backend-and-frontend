import { useEffect, useState } from "react";
import type { DesignerBackup } from "../objects/designer-page-types.js";

export const DESIGNER_BACKUPS_STORAGE_KEY = "ugc-level-platform.designer-backups.v1";
export const MAX_DESIGNER_BACKUPS = 5;

export const useDesignerBackups = () => {
  const [designerBackups, setDesignerBackups] = useState<DesignerBackup[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(DESIGNER_BACKUPS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as DesignerBackup[];
      setDesignerBackups(Array.isArray(parsed) ? parsed.slice(0, MAX_DESIGNER_BACKUPS) : []);
    } catch {
      setDesignerBackups([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(DESIGNER_BACKUPS_STORAGE_KEY, JSON.stringify(designerBackups));
  }, [designerBackups]);

  return {
    designerBackups,
    setDesignerBackups,
  };
};
