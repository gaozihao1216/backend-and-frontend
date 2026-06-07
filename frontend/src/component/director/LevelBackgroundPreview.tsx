import { useEffect, useMemo, useRef } from "react";
import { getStretchVisualDesignStyle } from "../ui-renderer/ui-renderer-utils.js";
import { useVisualAsset } from "../../hook/useVisualAsset.js";
import {
  createLevelBackgroundCloudSprites,
  getLevelBackgroundGradientStyle,
  type LevelBackgroundCloudSprite,
} from "../../lib/level-background-template-render.js";
import type { LevelBackgroundTemplate } from "../../objects/level/level-background-template.js";
import type { StretchVisualDesign } from "../../objects/ui-customization/ui-customization-objects.js";

type LevelBackgroundPreviewProps = {
  template: LevelBackgroundTemplate;
  panelBackgroundDesign?: StretchVisualDesign | null;
  cloudPatternDesigns?: StretchVisualDesign[];
  width?: number;
  height?: number;
  className?: string;
};

type RainDrop = {
  x: number;
  y: number;
  length: number;
  speed: number;
};

const LevelBackgroundPanelLayer = ({ design }: { design: StretchVisualDesign }) => {
  const sourceDataUrl = useVisualAsset(design.templateId, design.sourceDataUrl);
  const style = getStretchVisualDesignStyle({
    ...design,
    sourceDataUrl,
  });

  return <span className="level-background-panel-layer" style={style} aria-hidden="true" />;
};

const LevelBackgroundCloudSprite = ({
  design,
  sprite,
}: {
  design: StretchVisualDesign;
  sprite: LevelBackgroundCloudSprite;
}) => {
  const sourceDataUrl = useVisualAsset(design.templateId, design.sourceDataUrl);
  const style = getStretchVisualDesignStyle({
    ...design,
    sourceDataUrl,
  });

  return (
    <span
      className="level-background-cloud-sprite"
      data-cloud-id={sprite.id}
      style={{
        ...style,
        width: `${sprite.width}px`,
        height: `${sprite.height}px`,
        opacity: sprite.opacity,
      }}
      aria-hidden="true"
    />
  );
};

const createRain = (width: number, height: number, intensity: number): RainDrop[] => {
  const count = Math.round((intensity / 100) * 180);
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    length: 10 + Math.random() * 16,
    speed: 8 + Math.random() * 10,
  }));
};

const drawProceduralCloud = (ctx: CanvasRenderingContext2D, sprite: LevelBackgroundCloudSprite) => {
  ctx.save();
  ctx.globalAlpha = sprite.opacity;
  ctx.fillStyle = "#ffffff";

  const { x, y, width, height } = sprite;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.25, y + height * 0.55, width * 0.22, height * 0.45, 0, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.48, y + height * 0.42, width * 0.28, height * 0.55, 0, 0, Math.PI * 2);
  ctx.ellipse(x + width * 0.72, y + height * 0.58, width * 0.2, height * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const LevelBackgroundPreview = ({
  template,
  panelBackgroundDesign = null,
  cloudPatternDesigns = [],
  width = 960,
  height = 540,
  className = "",
}: LevelBackgroundPreviewProps) => {
  const weatherCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudLayerRef = useRef<HTMLDivElement | null>(null);
  const cloudSprites = useMemo(
    () => createLevelBackgroundCloudSprites(width, height, template.effects.cloudDensity, cloudPatternDesigns.length),
    [cloudPatternDesigns.length, height, template.effects.cloudDensity, width],
  );
  const usePatternClouds = cloudPatternDesigns.length > 0;

  useEffect(() => {
    if (!usePatternClouds || !cloudLayerRef.current) {
      return undefined;
    }

    const layer = cloudLayerRef.current;
    const positions = cloudSprites.map((sprite) => ({ ...sprite }));
    let animationFrame = 0;
    let lastTimestamp = 0;

    positions.forEach((sprite, index) => {
      const element = layer.children[index] as HTMLElement | undefined;
      if (element) {
        element.style.transform = `translate3d(${sprite.x}px, ${sprite.y}px, 0)`;
      }
    });

    const tick = (timestamp: number) => {
      const deltaMs = lastTimestamp === 0 ? 16 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const cloudSpeed = (template.effects.cloudSpeed / 100) * deltaMs * 0.08;

      positions.forEach((sprite, index) => {
        sprite.x += sprite.speed * cloudSpeed;
        if (sprite.x - sprite.width > width) {
          sprite.x = -sprite.width;
        }

        const element = layer.children[index] as HTMLElement | undefined;
        if (element) {
          element.style.transform = `translate3d(${sprite.x}px, ${sprite.y}px, 0)`;
        }
      });

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [cloudSprites, template.effects.cloudSpeed, usePatternClouds, width]);

  useEffect(() => {
    const canvas = weatherCanvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }

    const proceduralClouds = createLevelBackgroundCloudSprites(
      width,
      height,
      template.effects.cloudDensity,
      1,
    );
    const rain = createRain(width, height, template.effects.rainIntensity);
    let animationFrame = 0;
    let lastTimestamp = 0;
    let nextLightningAt = performance.now() + template.effects.lightningIntervalMs;
    let lightningFlash = 0;

    const tick = (timestamp: number) => {
      const deltaMs = lastTimestamp === 0 ? 16 : timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, width, height);

      if (!usePatternClouds) {
        const cloudSpeed = (template.effects.cloudSpeed / 100) * deltaMs * 0.08;
        for (const cloud of proceduralClouds) {
          cloud.x += cloud.speed * cloudSpeed;
          if (cloud.x - cloud.width > width) {
            cloud.x = -cloud.width;
          }
          drawProceduralCloud(ctx, cloud);
        }
      }

      if (template.weather === "rainy" || template.weather === "thunderstorm") {
        ctx.strokeStyle = template.weather === "thunderstorm" ? "rgba(210,225,255,0.55)" : "rgba(210,230,255,0.42)";
        ctx.lineWidth = 1.2;
        const rainSpeed = (template.effects.rainSpeed / 10) * deltaMs * 0.9;

        for (const drop of rain) {
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.length);
          ctx.stroke();

          drop.y += drop.speed * rainSpeed * 0.08;
          drop.x -= 0.6;

          if (drop.y > height + drop.length) {
            drop.y = -drop.length;
            drop.x = Math.random() * width;
          }
        }
      }

      if (template.weather === "thunderstorm") {
        if (timestamp >= nextLightningAt) {
          lightningFlash = template.effects.lightningFlashOpacity;
          nextLightningAt = timestamp + template.effects.lightningIntervalMs * (0.65 + Math.random() * 0.7);
        }

        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(240,248,255,${lightningFlash})`;
          ctx.fillRect(0, 0, width, height);

          if (Math.random() > 0.55) {
            ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, lightningFlash + 0.1)})`;
            ctx.lineWidth = 3;
            const startX = width * (0.25 + Math.random() * 0.5);
            ctx.beginPath();
            ctx.moveTo(startX, 0);
            let currentX = startX;
            let currentY = 0;
            while (currentY < height * 0.55) {
              currentX += (Math.random() - 0.5) * 36;
              currentY += 24 + Math.random() * 28;
              ctx.lineTo(currentX, currentY);
            }
            ctx.stroke();
          }

          lightningFlash = Math.max(0, lightningFlash - deltaMs * 0.0045);
        }
      }

      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [
    height,
    template,
    usePatternClouds,
    width,
  ]);

  return (
    <div
      className={`level-background-preview${className ? ` ${className}` : ""}`}
      style={{ aspectRatio: `${width} / ${height}` }}
      aria-label={`${template.name} 背景预览`}
    >
      <div className="level-background-gradient-layer" style={getLevelBackgroundGradientStyle(template)} aria-hidden="true" />

      {panelBackgroundDesign ? <LevelBackgroundPanelLayer design={panelBackgroundDesign} /> : null}

      <div
        className="level-background-accent-layer"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0) 62%, ${template.accentColor}33 100%)`,
        }}
        aria-hidden="true"
      />

      {usePatternClouds ? (
        <div ref={cloudLayerRef} className="level-background-cloud-layer" aria-hidden="true">
          {cloudSprites.map((sprite) => {
            const design = cloudPatternDesigns[sprite.designIndex % cloudPatternDesigns.length];
            if (!design) {
              return null;
            }

            return <LevelBackgroundCloudSprite key={sprite.id} design={design} sprite={sprite} />;
          })}
        </div>
      ) : null}

      <canvas
        ref={weatherCanvasRef}
        width={width}
        height={height}
        className={`level-background-weather-canvas${usePatternClouds ? " pattern-clouds" : ""}`}
        aria-hidden="true"
      />
    </div>
  );
};
