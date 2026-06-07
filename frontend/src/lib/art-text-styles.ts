import type { CSSProperties } from "react";
import type {
  TextArtDesign,
  TextArtGradientDirection,
  TextArtGradientIntensity,
  TextArtPreset,
} from "../objects/ui-customization/ui-customization-objects.js";

export const TEXT_ART_FONT_FAMILIES = {
  inkBrush: '"Ma Shan Zheng", "KaiTi", "STKaiti", cursive',
  runningScript: '"Long Cang", "STXingkai", cursive',
  sealCinnabar: '"ZCOOL XiaoWei", "SimSun", serif',
} as const;

export const TEXT_ART_PRESET_OPTIONS: ReadonlyArray<{
  value: TextArtPreset;
  label: string;
  description: string;
}> = [
  { value: "plain", label: "普通文本", description: "常规字体，适合说明文字" },
  { value: "goldGradient", label: "鎏金渐变", description: "金色渐变艺术字，可调方向与强度" },
  { value: "inkBrush", label: "墨韵楷书", description: "毛笔楷书风格，使用纯色墨色" },
  { value: "runningScript", label: "行云行草", description: "行草书法体 + 渐变铺色" },
  { value: "sealCinnabar", label: "朱印篆意", description: "印章朱红渐变风格" },
];

export const TEXT_ART_GRADIENT_DIRECTION_OPTIONS: ReadonlyArray<{
  value: TextArtGradientDirection;
  label: string;
}> = [
  { value: "toBottom", label: "从上到下" },
  { value: "toTop", label: "从下到上" },
  { value: "toRight", label: "从左到右" },
  { value: "toLeft", label: "从右到左" },
  { value: "diagonal", label: "斜向（左上到右下）" },
];

export const TEXT_ART_GRADIENT_INTENSITY_OPTIONS: ReadonlyArray<{
  value: TextArtGradientIntensity;
  label: string;
  description: string;
}> = [
  { value: "soft", label: "柔和", description: "色差小，过渡更平" },
  { value: "normal", label: "标准", description: "默认对比度" },
  { value: "strong", label: "强烈", description: "高对比，层次更分明" },
];

export const DEFAULT_TEXT_ART_DESIGN: TextArtDesign = {
  preset: "goldGradient",
  gradientDirection: "toBottom",
  gradientIntensity: "normal",
};

export const resolveTextArtDesign = (design?: TextArtDesign | null): TextArtDesign =>
  design ?? DEFAULT_TEXT_ART_DESIGN;

export const isArtTextPreset = (preset: TextArtPreset): boolean => preset !== "plain";

export const usesTextArtGradient = (preset: TextArtPreset): boolean =>
  preset === "goldGradient" || preset === "runningScript" || preset === "sealCinnabar";

export const getTextArtPresetLabel = (preset: TextArtPreset): string =>
  TEXT_ART_PRESET_OPTIONS.find((option) => option.value === preset)?.label ?? preset;

export const getTextArtAccentDefault = (preset: TextArtPreset): string => {
  switch (preset) {
    case "goldGradient":
      return "#ffd76a";
    case "inkBrush":
      return "#2b4257";
    case "runningScript":
      return "#355c7d";
    case "sealCinnabar":
      return "#c62828";
    case "plain":
    default:
      return "#203040";
  }
};

export const getTextArtAccentColor = (design?: TextArtDesign | null): string => {
  const resolved = resolveTextArtDesign(design);
  return resolved.accentColor ?? getTextArtAccentDefault(resolved.preset);
};

export const getTextArtAccentLabel = (preset: TextArtPreset): string =>
  usesTextArtGradient(preset) ? "主色" : "墨色";

export const getTextArtAccentHint = (preset: TextArtPreset): string => {
  if (usesTextArtGradient(preset)) {
    return "主色只影响渐变中间那一层色调；浅色起笔、深色收笔由系统自动推导，不会叠加描边以免发糊。";
  }

  if (preset === "inkBrush") {
    return "墨色用于整段文字填充，不使用渐变。";
  }

  return "";
};

export const getTextArtGradientDirection = (design?: TextArtDesign | null): TextArtGradientDirection => {
  const resolved = resolveTextArtDesign(design);
  if (resolved.gradientDirection) {
    return resolved.gradientDirection;
  }

  return resolved.preset === "runningScript" ? "diagonal" : "toBottom";
};

export const getTextArtGradientIntensity = (design?: TextArtDesign | null): TextArtGradientIntensity =>
  resolveTextArtDesign(design).gradientIntensity ?? "normal";

export const patchTextArtDesign = (
  current: TextArtDesign | undefined,
  patch: Partial<TextArtDesign>,
): TextArtDesign => {
  const base = resolveTextArtDesign(current);
  const preset = patch.preset ?? base.preset;
  const accentColor = patch.accentColor ?? base.accentColor;
  const gradientDirection = patch.gradientDirection ?? base.gradientDirection;
  const gradientIntensity = patch.gradientIntensity ?? base.gradientIntensity;

  return {
    preset,
    ...(accentColor ? { accentColor } : {}),
    ...(usesTextArtGradient(preset) && gradientDirection ? { gradientDirection } : {}),
    ...(usesTextArtGradient(preset) && gradientIntensity ? { gradientIntensity } : {}),
  };
};

const GRADIENT_ANGLES: Record<TextArtGradientDirection, number> = {
  toBottom: 180,
  toTop: 0,
  toRight: 90,
  toLeft: 270,
  diagonal: 135,
};

const clampChannel = (value: number) => Math.min(255, Math.max(0, Math.round(value)));

const parseHexColor = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "").trim();
  const full = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized.padStart(6, "0").slice(0, 6);

  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
};

const toHexColor = (red: number, green: number, blue: number): string =>
  `#${[red, green, blue].map((channel) => clampChannel(channel).toString(16).padStart(2, "0")).join("")}`;

const mixHexColors = (from: string, to: string, ratio: number): string => {
  const [fromRed, fromGreen, fromBlue] = parseHexColor(from);
  const [toRed, toGreen, toBlue] = parseHexColor(to);
  const weight = Math.min(1, Math.max(0, ratio));

  return toHexColor(
    fromRed + (toRed - fromRed) * weight,
    fromGreen + (toGreen - fromGreen) * weight,
    fromBlue + (toBlue - fromBlue) * weight,
  );
};

const lightenHex = (hex: string, ratio: number) => mixHexColors(hex, "#ffffff", ratio);
const darkenHex = (hex: string, ratio: number) => mixHexColors(hex, "#000000", ratio);

type GradientVariant = "gold" | "script" | "seal";

const buildGradientStops = (
  accent: string,
  intensity: TextArtGradientIntensity,
  variant: GradientVariant,
): { start: string; midStop: string; endStop: string; end: string } => {
  const variantStart = variant === "gold"
    ? lightenHex(accent, 0.88)
    : variant === "seal"
      ? lightenHex(accent, 0.82)
      : lightenHex(accent, 0.92);

  switch (intensity) {
    case "soft":
      return {
        start: variantStart,
        midStop: "78%",
        endStop: "100%",
        end: darkenHex(accent, 0.18),
      };
    case "strong":
      return {
        start: lightenHex(accent, 0.95),
        midStop: "38%",
        endStop: "100%",
        end: darkenHex(accent, variant === "seal" ? 0.58 : 0.62),
      };
    case "normal":
    default:
      return {
        start: variantStart,
        midStop: "52%",
        endStop: "100%",
        end: darkenHex(accent, variant === "script" ? 0.55 : 0.42),
      };
  }
};

const buildArtTextGradient = (
  accent: string,
  direction: TextArtGradientDirection,
  intensity: TextArtGradientIntensity,
  variant: GradientVariant,
): string => {
  const angle = GRADIENT_ANGLES[direction];
  const stops = buildGradientStops(accent, intensity, variant);
  return `linear-gradient(${angle}deg, ${stops.start} 0%, ${accent} ${stops.midStop}, ${stops.end} ${stops.endStop})`;
};

const getGradientVariant = (preset: TextArtPreset): GradientVariant => {
  switch (preset) {
    case "runningScript":
      return "script";
    case "sealCinnabar":
      return "seal";
    case "goldGradient":
    default:
      return "gold";
  }
};

export const getPanelTextArtGradientValue = (design?: TextArtDesign | null): string => {
  const resolved = resolveTextArtDesign(design);
  const accent = getTextArtAccentColor(resolved);
  return buildArtTextGradient(
    accent,
    getTextArtGradientDirection(resolved),
    getTextArtGradientIntensity(resolved),
    getGradientVariant(resolved.preset),
  );
};

export const getPanelTextArtContainerClassName = (design?: TextArtDesign | null): string => {
  const preset = resolveTextArtDesign(design).preset;
  return isArtTextPreset(preset) ? "dynamic-ui-text-art" : "";
};

export const getPanelTextArtContentClassName = (design?: TextArtDesign | null): string => {
  const resolved = resolveTextArtDesign(design);
  if (!isArtTextPreset(resolved.preset)) {
    return "";
  }

  const classes = ["dynamic-ui-text-art-content", `preset-${resolved.preset}`];
  if (usesTextArtGradient(resolved.preset)) {
    classes.push("is-gradient");
  }

  return classes.join(" ");
};

export const getPanelTextArtContainerStyle = (design?: TextArtDesign | null): CSSProperties => {
  const resolved = resolveTextArtDesign(design);
  const preset = resolved.preset;
  if (!isArtTextPreset(preset)) {
    return {};
  }

  const style: CSSProperties = {
    containerType: "size",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    background: "transparent",
    padding: 0,
    borderRadius: 0,
    border: "none",
    boxShadow: "none",
  };

  if (usesTextArtGradient(preset)) {
    return {
      ...style,
      ["--text-art-gradient" as string]: getPanelTextArtGradientValue(resolved),
    };
  }

  return style;
};

const getPanelTextArtTypographyStyle = (
  options?: { interactive?: boolean },
): CSSProperties => ({
  display: "inline-block",
  maxWidth: "100%",
  maxHeight: "100%",
  lineHeight: 1.08,
  textAlign: "center",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  overflow: "hidden",
  verticalAlign: "middle",
  ...(options?.interactive ? { touchAction: "none" as const } : { pointerEvents: "none" as const }),
});

export const getPanelTextArtContentStyle = (
  design?: TextArtDesign | null,
  options?: { interactive?: boolean },
): CSSProperties => {
  const resolved = resolveTextArtDesign(design);
  const accent = getTextArtAccentColor(resolved);
  const typography = getPanelTextArtTypographyStyle(options);

  switch (resolved.preset) {
    case "plain":
      return {
        display: "block",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      };
    case "goldGradient":
    case "runningScript":
    case "sealCinnabar":
      return {
        ...typography,
        fontWeight: resolved.preset === "sealCinnabar" ? 700 : resolved.preset === "goldGradient" ? 800 : 400,
        fontFamily: resolved.preset === "runningScript"
          ? TEXT_ART_FONT_FAMILIES.runningScript
          : resolved.preset === "sealCinnabar"
            ? TEXT_ART_FONT_FAMILIES.sealCinnabar
            : undefined,
        letterSpacing: resolved.preset === "sealCinnabar"
          ? "0.12em"
          : resolved.preset === "goldGradient"
            ? "0.04em"
            : "0.02em",
      };
    case "inkBrush":
      return {
        ...typography,
        fontFamily: TEXT_ART_FONT_FAMILIES.inkBrush,
        fontWeight: 400,
        letterSpacing: "0.08em",
        color: accent,
      };
    default:
      return typography;
  }
};
