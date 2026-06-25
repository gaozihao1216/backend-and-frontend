import { useEffect, type DependencyList } from "react";

export const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement
  && (
    target.tagName === "INPUT"
    || target.tagName === "TEXTAREA"
    || target.tagName === "SELECT"
    || target.isContentEditable
  );

export const useDesignerKeyboardShortcuts = (
  register: () => {
    handleKeyDown: (event: KeyboardEvent) => void;
    handleKeyUp: (event: KeyboardEvent) => void;
    handleModifierState?: (event: KeyboardEvent) => void;
  },
  dependencies: DependencyList,
) => {
  useEffect(() => {
    const { handleKeyDown, handleKeyUp, handleModifierState } = register();
    window.addEventListener("keydown", handleKeyDown);
    if (handleModifierState) {
      window.addEventListener("keydown", handleModifierState);
    }
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (handleModifierState) {
        window.removeEventListener("keydown", handleModifierState);
      }
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, dependencies);
};
