import { useRef } from "react";

type RotationKnobProps = {
  angle: number;
  disabled?: boolean;
  label: string;
  precisionMultiplier?: number;
  variant?: "coarse" | "fine";
  onChange: (angle: number) => void;
};

const normalizeAngle = (angle: number) => {
  if (angle > Math.PI) {
    return angle - Math.PI * 2;
  }
  if (angle < -Math.PI) {
    return angle + Math.PI * 2;
  }
  return angle;
};

export const RotationKnob = ({
  angle,
  disabled = false,
  label,
  precisionMultiplier = 1,
  variant = "coarse",
  onChange,
}: RotationKnobProps) => {
  const knobRef = useRef<HTMLButtonElement | null>(null);
  const lastAngleRef = useRef<number | null>(null);

  const updateAngleFromPointer = (clientX: number, clientY: number) => {
    const knob = knobRef.current;
    if (!knob || disabled) {
      return;
    }

    const rect = knob.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const pointerAngle = Math.atan2(clientY - centerY, clientX - centerX);
    const lastAngle = lastAngleRef.current;
    if (lastAngle === null) {
      lastAngleRef.current = pointerAngle;
      onChange(normalizeAngle(pointerAngle));
      return;
    }

    let delta = pointerAngle - lastAngle;
    if (delta > Math.PI) {
      delta -= Math.PI * 2;
    } else if (delta < -Math.PI) {
      delta += Math.PI * 2;
    }

    lastAngleRef.current = pointerAngle;
    onChange(normalizeAngle(angle + delta / precisionMultiplier));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    lastAngleRef.current = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    updateAngleFromPointer(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    lastAngleRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div className={`rotation-knob-panel ${disabled ? "disabled" : ""}`}>
      <span>{label}</span>
      <button
        ref={knobRef}
        type="button"
        className={`rotation-knob ${variant}`}
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span
          className="rotation-knob-indicator"
          style={{ transform: `translateX(-50%) rotate(${angle}rad)` }}
        />
      </button>
    </div>
  );
};
