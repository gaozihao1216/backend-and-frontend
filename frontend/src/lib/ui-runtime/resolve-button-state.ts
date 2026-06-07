import type { ButtonComponent, ButtonStateOption } from "../../objects/ui-customization/ui-customization-objects.js";

const getPathValue = (value: unknown, path: string): unknown => {
  if (!path.trim()) {
    return value;
  }

  return path.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || !(segment in current)) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
};

export const resolveActiveButtonState = (
  button: ButtonComponent,
  uiData: Record<string, unknown>,
): ButtonStateOption | null => {
  const stateDesign = button.stateDesign;
  if (!stateDesign) {
    return null;
  }

  const fallbackState = stateDesign.states.find((state: ButtonStateOption) => state.id === stateDesign.defaultStateId)
    ?? stateDesign.states[0]
    ?? null;

  const stateSource = stateDesign.stateSource;
  if (!stateSource) {
    return fallbackState;
  }

  const payload = uiData[stateSource.apiKey];
  if (!payload || typeof payload !== "object") {
    return fallbackState;
  }

  const resolvedValue = getPathValue(payload, stateSource.field);
  if (resolvedValue == null) {
    return fallbackState;
  }

  const matchedState = stateDesign.states.find((state: ButtonStateOption) => state.id === String(resolvedValue));
  return matchedState ?? fallbackState;
};

export const isButtonActionDisabled = (
  button: ButtonComponent,
  activeState: ButtonStateOption | null,
): boolean => {
  if (activeState?.id === "locked" && button.action.type === "navigate") {
    return true;
  }

  if (button.action.type !== "apiAction") {
    return false;
  }

  if (
    button.action.apiKey === "player.checkIn.claim"
    || button.action.apiKey === "player.weeklyCheckIn.claim"
  ) {
    return activeState?.id !== "ready";
  }

  return false;
};
