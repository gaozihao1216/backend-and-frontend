import type { LevelMapPathEdgeVisualState } from "../../lib/level-map-path.js";
import {
  buildEdgePolyline,
  buildPlankBridgePlacements,
  getBridgeWoodGradientId,
  getScaledBridgePlankLayout,
  percentPointToCanvasSvgPoint,
  percentPointsToCanvasSvgPoints,
  resolveEdgeAnchorPoints,
  resolveEdgeVisualState,
  resolveLevelMapCanvasSize,
} from "../../lib/level-map-path.js";
import type {
  LevelMapPathDesign,
  LevelMapPathEdge,
  PanelContentSize,
} from "../../objects/ui-customization/ui-customization-objects.js";
import type { ComponentMap } from "./ui-renderer-types.js";

type LevelMapPathLayerProps = {
  pathDesign: LevelMapPathDesign;
  componentMap: ComponentMap;
  uiData: Record<string, unknown>;
  contentSize?: PanelContentSize | undefined;
  selectedEdgeId?: string | null;
  onSelectEdge?: (edgeId: string) => void;
};

const BridgePathDefs = () => (
  <defs>
    <linearGradient id="level-map-bridge-wood-active" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#e3b56a" />
      <stop offset="42%" stopColor="#c98b46" />
      <stop offset="100%" stopColor="#7b4e28" />
    </linearGradient>
    <linearGradient id="level-map-bridge-wood-active-alt" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#d7a85d" />
      <stop offset="42%" stopColor="#bf7f3a" />
      <stop offset="100%" stopColor="#704824" />
    </linearGradient>
    <linearGradient id="level-map-bridge-wood-pending" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#d8aa62" />
      <stop offset="42%" stopColor="#bf8440" />
      <stop offset="100%" stopColor="#73502a" />
    </linearGradient>
    <linearGradient id="level-map-bridge-wood-pending-alt" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#cc9d58" />
      <stop offset="42%" stopColor="#b07838" />
      <stop offset="100%" stopColor="#684622" />
    </linearGradient>
    <linearGradient id="level-map-bridge-wood-inactive" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#c4b39a" />
      <stop offset="42%" stopColor="#a89278" />
      <stop offset="100%" stopColor="#75685a" />
    </linearGradient>
    <linearGradient id="level-map-bridge-wood-inactive-alt" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#b8a892" />
      <stop offset="42%" stopColor="#9a8872" />
      <stop offset="100%" stopColor="#6a5e52" />
    </linearGradient>
    <filter id="level-map-bridge-drop-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0.1" stdDeviation="0.1" floodColor="#6b4720" floodOpacity="0.28" />
    </filter>
  </defs>
);

const getEdgeStrokeClass = (visualState: LevelMapPathEdgeVisualState, selected: boolean): string => {
  const classes = ["level-map-path-edge"];
  if (selected) {
    classes.push("selected");
  }
  classes.push(`state-${visualState}`);
  return classes.join(" ");
};

const renderPlankEdge = (
  edge: LevelMapPathEdge,
  from: { x: number; y: number },
  to: { x: number; y: number },
  waypoints: Array<{ x: number; y: number }>,
  visualState: LevelMapPathEdgeVisualState,
  selected: boolean,
  onSelectEdge?: (edgeId: string) => void,
) => {
  const widthScale = edge.style?.width ?? 1;
  const planks = buildPlankBridgePlacements(from, to, waypoints, widthScale);
  const layout = getScaledBridgePlankLayout(widthScale);

  return (
    <g
      key={edge.id}
      className={getEdgeStrokeClass(visualState, selected)}
      filter="url(#level-map-bridge-drop-shadow)"
      onPointerDown={onSelectEdge ? (event) => {
        event.stopPropagation();
        onSelectEdge(edge.id);
      } : undefined}
    >
      <path
        d={buildEdgePolyline(from, to, waypoints)
          .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
          .join(" ")}
        className="level-map-path-hit-area"
        fill="none"
      />
      {planks.map((plank, index) => {
        const woodGradientId = getBridgeWoodGradientId(visualState, plank.variant);

        return (
          <g
            key={`${edge.id}-${index}`}
            transform={`rotate(${plank.rotation} ${plank.x} ${plank.y})`}
          >
            <rect
              className="level-map-path-plank-shadow"
              x={plank.x - layout.halfLongEdgeLength}
              y={plank.y - layout.halfShortEdgeWidth + layout.shadowOffsetY}
              rx={layout.radius}
              ry={layout.radius}
              width={layout.longEdgeLength}
              height={layout.shortEdgeWidth}
            />
            <rect
              className="level-map-path-plank"
              x={plank.x - layout.halfLongEdgeLength}
              y={plank.y - layout.halfShortEdgeWidth}
              rx={layout.radius}
              ry={layout.radius}
              width={layout.longEdgeLength}
              height={layout.shortEdgeWidth}
              fill={`url(#${woodGradientId})`}
            />
            <rect
              className="level-map-path-plank-shine"
              x={plank.x - layout.halfLongEdgeLength * 0.84}
              y={plank.y - layout.halfShortEdgeWidth * 0.62}
              rx={layout.radius * 0.35}
              ry={layout.radius * 0.35}
              width={layout.longEdgeLength * 0.72}
              height={layout.shineHeight}
            />
            {plank.showEndSeam ? (
              <line
                className="level-map-path-plank-seam"
                x1={plank.x + layout.halfLongEdgeLength - layout.gapAlongPath * 0.35}
                y1={plank.y - layout.halfShortEdgeWidth * 0.82}
                x2={plank.x + layout.halfLongEdgeLength - layout.gapAlongPath * 0.35}
                y2={plank.y + layout.halfShortEdgeWidth * 0.82}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};

const renderLineEdge = (
  edge: LevelMapPathEdge,
  points: Array<{ x: number; y: number }>,
  visualState: LevelMapPathEdgeVisualState,
  selected: boolean,
  templateId: "rope" | "dashed",
  onSelectEdge?: (edgeId: string) => void,
) => {
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const strokeWidth = 0.55 * (edge.style?.width ?? 1);

  return (
    <g
      key={edge.id}
      className={getEdgeStrokeClass(visualState, selected)}
      onPointerDown={onSelectEdge ? (event) => {
        event.stopPropagation();
        onSelectEdge(edge.id);
      } : undefined}
    >
      <path
        d={path}
        className={templateId === "rope" ? "level-map-path-rope-line" : "level-map-path-dashed-line"}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <path
        d={path}
        className="level-map-path-hit-area"
        strokeWidth={Math.max(strokeWidth, 2.4)}
        fill="none"
      />
    </g>
  );
};

export const LevelMapPathLayer = ({
  pathDesign,
  componentMap,
  uiData,
  contentSize,
  selectedEdgeId = null,
  onSelectEdge,
}: LevelMapPathLayerProps) => {
  const canvasSize = resolveLevelMapCanvasSize(contentSize);

  return (
    <svg
      className="level-map-path-layer"
      viewBox={`0 0 ${canvasSize.widthPercent} ${canvasSize.heightPercent}`}
      preserveAspectRatio="none"
      aria-hidden={onSelectEdge ? undefined : true}
    >
      <BridgePathDefs />
      {pathDesign.edges.map((edge) => {
        const anchors = resolveEdgeAnchorPoints(edge, componentMap);
        if (!anchors) {
          return null;
        }

        const from = percentPointToCanvasSvgPoint(anchors.from, canvasSize);
        const to = percentPointToCanvasSvgPoint(anchors.to, canvasSize);
        const waypoints = percentPointsToCanvasSvgPoints(edge.waypoints ?? [], canvasSize);
        const visualState = resolveEdgeVisualState(edge, uiData);
        const selected = selectedEdgeId === edge.id;
        const templateId = edge.style?.templateId ?? "plank";
        const points = buildEdgePolyline(from, to, waypoints);

        if (templateId === "plank") {
          return renderPlankEdge(edge, from, to, waypoints, visualState, selected, onSelectEdge);
        }

        return renderLineEdge(edge, points, visualState, selected, templateId, onSelectEdge);
      })}
    </svg>
  );
};
