import { getDefaultGroundMaterialRenderConfig } from "../../../lib/game-engine/draw-scene.js";
import type { GroundMaterialRenderConfig } from "../../../lib/game-engine/draw-scene.js";
import {
  DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG,
  getDefaultBoundaryBreakpointEpsilon,
  type GroundStrokeSimplifyConfig,
} from "../../../lib/ground.js";
import { GroundTuningPanel } from "../GroundTuningPanel.js";
import { GROUND_TUNING_LIMITS } from "../../../lib/designer-page/ground-tuning-functions.js";

type SettingsPageProps = {
  onExitSettingsPage?: (() => void) | undefined;

  groundStrokeSimplifyConfig: GroundStrokeSimplifyConfig;
  setGroundStrokeSimplifyConfig: (value: GroundStrokeSimplifyConfig) => void;

  boundaryBreakpointEpsilon: number;
  setBoundaryBreakpointEpsilonState: (value: number) => void;

  groundMaterialRenderConfig: GroundMaterialRenderConfig;
  setGroundMaterialRenderConfigState: (value: GroundMaterialRenderConfig) => void;

  updateGroundStrokeSimplifyConfig: (
    key: keyof GroundStrokeSimplifyConfig,
    rawValue: number,
  ) => void;

  updateBoundaryBreakpointEpsilon: (rawValue: number) => void;

  updateGroundMaterialRenderConfig: (
    key: keyof GroundMaterialRenderConfig,
    rawValue: number,
  ) => void;

  bottomThickness: number;
};

export const SettingsPage = ({
  onExitSettingsPage,
  groundStrokeSimplifyConfig,
  setGroundStrokeSimplifyConfig,
  boundaryBreakpointEpsilon,
  setBoundaryBreakpointEpsilonState,
  groundMaterialRenderConfig,
  setGroundMaterialRenderConfigState,
  updateGroundStrokeSimplifyConfig,
  updateBoundaryBreakpointEpsilon,
  updateGroundMaterialRenderConfig,
  bottomThickness,
}: SettingsPageProps) => (
  <GroundTuningPanel>
    <section className="panel designer-workspace-panel designer-doc-page">
        <div className="actions">
          <button type="button" className="secondary" onClick={onExitSettingsPage}>
            返回设计页
          </button>
        </div>
        <div className="designer-doc-hero">
          <div>
            <p className="eyebrow">designer/design/settings</p>
            <h2>地形设置</h2>
            <p className="panel-copy">
              这里集中放置边界重绘和自动生成地面时会用到的参数，避免主设计页被大量调参控件打断。所有修改都会立即写入本地浏览器，并作用到后续的重绘操作。
            </p>
          </div>
          <div className="designer-doc-summary-grid">
            <div className="designer-doc-summary-card">
              <span>最小局部跨度</span>
              <strong>{groundStrokeSimplifyConfig.minSpan}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>转角权重</span>
              <strong>{groundStrokeSimplifyConfig.angleWeight.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>停止阈值</span>
              <strong>{groundStrokeSimplifyConfig.stopEpsilon.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>断点阈值</span>
              <strong>{boundaryBreakpointEpsilon}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>无草坡度</span>
              <strong>{groundMaterialRenderConfig.noGrassSlope.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>Cliff 区间</span>
              <strong>{`${groundMaterialRenderConfig.cliffStart.toFixed(2)} → ${groundMaterialRenderConfig.cliffEnd.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>a1 / a2</span>
              <strong>{`${groundMaterialRenderConfig.a1.toFixed(2)} / ${groundMaterialRenderConfig.a2.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>alpha</span>
              <strong>{`${groundMaterialRenderConfig.alphaBase.toFixed(2)} ± ${groundMaterialRenderConfig.alphaJitter.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>Sigmoid</span>
              <strong>{`${groundMaterialRenderConfig.sigmoidA.toFixed(2)} / ${groundMaterialRenderConfig.sigmoidGamma.toFixed(2)}`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>噪声强度</span>
              <strong>{groundMaterialRenderConfig.noiseStrength.toFixed(2)}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>草土曲线</span>
              <strong>{`${groundMaterialRenderConfig.grassCurveSampleStep}px / ${groundMaterialRenderConfig.grassCurveSmoothingPasses}次`}</strong>
            </div>
            <div className="designer-doc-summary-card">
              <span>默认厚度</span>
              <strong>{bottomThickness}</strong>
            </div>
          </div>
        </div>
        <div className="designer-ground-tuning-panel">
          <div className="card-header">
            <strong>抽稀调参</strong>
            <button
              type="button"
              className="secondary"
              onClick={() => setGroundStrokeSimplifyConfig(DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG)}
            >
              恢复默认
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setBoundaryBreakpointEpsilonState(getDefaultBoundaryBreakpointEpsilon())}
            >
              重置断点阈值
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setGroundMaterialRenderConfigState(getDefaultGroundMaterialRenderConfig())}
            >
              重置材质参数
            </button>
          </div>
          <div className="designer-ground-tuning-grid">
            <label className="designer-ground-tuning-field">
              <span>最小局部跨度</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.minSpan.min}
                max={GROUND_TUNING_LIMITS.minSpan.max}
                step={GROUND_TUNING_LIMITS.minSpan.step}
                value={groundStrokeSimplifyConfig.minSpan}
                onChange={(event) => updateGroundStrokeSimplifyConfig("minSpan", Number(event.target.value))}
              />
              <strong>{groundStrokeSimplifyConfig.minSpan}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>转角权重</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.angleWeight.min}
                max={GROUND_TUNING_LIMITS.angleWeight.max}
                step={GROUND_TUNING_LIMITS.angleWeight.step}
                value={groundStrokeSimplifyConfig.angleWeight}
                onChange={(event) => updateGroundStrokeSimplifyConfig("angleWeight", Number(event.target.value))}
              />
              <strong>{groundStrokeSimplifyConfig.angleWeight.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>停止阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.stopEpsilon.min}
                max={GROUND_TUNING_LIMITS.stopEpsilon.max}
                step={GROUND_TUNING_LIMITS.stopEpsilon.step}
                value={groundStrokeSimplifyConfig.stopEpsilon}
                onChange={(event) => updateGroundStrokeSimplifyConfig("stopEpsilon", Number(event.target.value))}
              />
              <strong>{groundStrokeSimplifyConfig.stopEpsilon.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>断点阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.breakpointEpsilon.min}
                max={GROUND_TUNING_LIMITS.breakpointEpsilon.max}
                step={GROUND_TUNING_LIMITS.breakpointEpsilon.step}
                value={boundaryBreakpointEpsilon}
                onChange={(event) => updateBoundaryBreakpointEpsilon(Number(event.target.value))}
              />
              <strong>{boundaryBreakpointEpsilon}</strong>
            </label>
          </div>
          <p className="meta">
            `最小局部跨度` 越大，抽稀越偏向大结构；`转角权重` 越大，急弯越容易保点；`停止阈值` 越大，整体会更稀疏；`断点阈值` 越大，点越容易被识别为贴近上下边界的断点。修改后会立即作用到编辑器与运行时，并保存在本地浏览器。
          </p>
        </div>
        <div className="designer-ground-tuning-panel">
          <div className="card-header">
            <strong>地形材质渲染</strong>
            <span>运行时预览中的地面着色手感</span>
          </div>
          <div className="designer-ground-tuning-grid">
            <label className="designer-ground-tuning-field">
              <span>无草坡度阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.noGrassSlope.min}
                max={GROUND_TUNING_LIMITS.noGrassSlope.max}
                step={GROUND_TUNING_LIMITS.noGrassSlope.step}
                value={groundMaterialRenderConfig.noGrassSlope}
                onChange={(event) => updateGroundMaterialRenderConfig("noGrassSlope", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.noGrassSlope.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Cliff Start</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.cliffStart.min}
                max={GROUND_TUNING_LIMITS.cliffStart.max}
                step={GROUND_TUNING_LIMITS.cliffStart.step}
                value={groundMaterialRenderConfig.cliffStart}
                onChange={(event) => updateGroundMaterialRenderConfig("cliffStart", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.cliffStart.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Cliff End</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.cliffEnd.min}
                max={GROUND_TUNING_LIMITS.cliffEnd.max}
                step={GROUND_TUNING_LIMITS.cliffEnd.step}
                value={groundMaterialRenderConfig.cliffEnd}
                onChange={(event) => updateGroundMaterialRenderConfig("cliffEnd", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.cliffEnd.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>岩石增强</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.cliffRockBoost.min}
                max={GROUND_TUNING_LIMITS.cliffRockBoost.max}
                step={GROUND_TUNING_LIMITS.cliffRockBoost.step}
                value={groundMaterialRenderConfig.cliffRockBoost}
                onChange={(event) => updateGroundMaterialRenderConfig("cliffRockBoost", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.cliffRockBoost.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>噪声强度</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.noiseStrength.min}
                max={GROUND_TUNING_LIMITS.noiseStrength.max}
                step={GROUND_TUNING_LIMITS.noiseStrength.step}
                value={groundMaterialRenderConfig.noiseStrength}
                onChange={(event) => updateGroundMaterialRenderConfig("noiseStrength", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.noiseStrength.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>a1 草阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.a1.min}
                max={GROUND_TUNING_LIMITS.a1.max}
                step={GROUND_TUNING_LIMITS.a1.step}
                value={groundMaterialRenderConfig.a1}
                onChange={(event) => updateGroundMaterialRenderConfig("a1", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.a1.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>a2 土阈值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.a2.min}
                max={GROUND_TUNING_LIMITS.a2.max}
                step={GROUND_TUNING_LIMITS.a2.step}
                value={groundMaterialRenderConfig.a2}
                onChange={(event) => updateGroundMaterialRenderConfig("a2", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.a2.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>alpha 基值</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.alphaBase.min}
                max={GROUND_TUNING_LIMITS.alphaBase.max}
                step={GROUND_TUNING_LIMITS.alphaBase.step}
                value={groundMaterialRenderConfig.alphaBase}
                onChange={(event) => updateGroundMaterialRenderConfig("alphaBase", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.alphaBase.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>alpha 扰动</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.alphaJitter.min}
                max={GROUND_TUNING_LIMITS.alphaJitter.max}
                step={GROUND_TUNING_LIMITS.alphaJitter.step}
                value={groundMaterialRenderConfig.alphaJitter}
                onChange={(event) => updateGroundMaterialRenderConfig("alphaJitter", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.alphaJitter.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Sigmoid A</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.sigmoidA.min}
                max={GROUND_TUNING_LIMITS.sigmoidA.max}
                step={GROUND_TUNING_LIMITS.sigmoidA.step}
                value={groundMaterialRenderConfig.sigmoidA}
                onChange={(event) => updateGroundMaterialRenderConfig("sigmoidA", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.sigmoidA.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Sigmoid Beta</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.sigmoidBeta.min}
                max={GROUND_TUNING_LIMITS.sigmoidBeta.max}
                step={GROUND_TUNING_LIMITS.sigmoidBeta.step}
                value={groundMaterialRenderConfig.sigmoidBeta}
                onChange={(event) => updateGroundMaterialRenderConfig("sigmoidBeta", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.sigmoidBeta.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>Sigmoid Gamma</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.sigmoidGamma.min}
                max={GROUND_TUNING_LIMITS.sigmoidGamma.max}
                step={GROUND_TUNING_LIMITS.sigmoidGamma.step}
                value={groundMaterialRenderConfig.sigmoidGamma}
                onChange={(event) => updateGroundMaterialRenderConfig("sigmoidGamma", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.sigmoidGamma.toFixed(2)}</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>草土曲线采样步长</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.grassCurveSampleStep.min}
                max={GROUND_TUNING_LIMITS.grassCurveSampleStep.max}
                step={GROUND_TUNING_LIMITS.grassCurveSampleStep.step}
                value={groundMaterialRenderConfig.grassCurveSampleStep}
                onChange={(event) => updateGroundMaterialRenderConfig("grassCurveSampleStep", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.grassCurveSampleStep}px</strong>
            </label>
            <label className="designer-ground-tuning-field">
              <span>草土曲线平滑轮数</span>
              <input
                type="range"
                min={GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.min}
                max={GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.max}
                step={GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.step}
                value={groundMaterialRenderConfig.grassCurveSmoothingPasses}
                onChange={(event) => updateGroundMaterialRenderConfig("grassCurveSmoothingPasses", Number(event.target.value))}
              />
              <strong>{groundMaterialRenderConfig.grassCurveSmoothingPasses}</strong>
            </label>
          </div>
          <p className="meta">
            `a1` 与 `a2` 控制场函数 `f(x,y)` 的分类阈值：小于 `a1` 为草，介于 `a1` 和 `a2` 为土，大于 `a2` 为石；`alpha 基值` 和 `alpha 扰动` 控制深度幂次推进速度及其局部随机变化；`Sigmoid A/Beta/Gamma` 控制斜率项 `S(slope)` 的整体高度、陡峭程度和拐点位置；`Cliff Start/End` 控制 `cliffFactor` 从开始生效到完全生效的坡度区间；`无草坡度阈值` 决定多陡开始直接禁用草层；`岩石增强` 会抬高陡坡上的石层倾向；`噪声强度` 控制最终明暗扰动幅度；`草土曲线采样步长` 和 `平滑轮数` 控制粗采样后的草土分界线拟合手感。
          </p>
        </div>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>参数说明</strong>
            <span>影响下一次笔画转边界的结果</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>最小局部跨度</h3>
              <p>控制局部几何在多小的范围内可以被继续细分。值越小，短促起伏越容易保留下来；值越大，系统越倾向把小幅波动视为噪声。</p>
              <p className="meta">适合场景：精修小洞顶、小台阶、密集折返时适当调小；做大轮廓山体时适当调大。</p>
            </article>
            <article className="designer-doc-card">
              <h3>转角权重</h3>
              <p>控制算法对"急弯"的敏感程度。值越大，明显转角越不容易被删点，轮廓会更贴近手绘的转折感。</p>
              <p className="meta">适合场景：想保留悬崖折角、洞口尖锐感时提高；想要更平顺的自然曲线时降低。</p>
            </article>
            <article className="designer-doc-card">
              <h3>停止阈值</h3>
              <p>控制抽稀过程在多早阶段停止。值越大，允许更早结束，结果会更稀疏；值越小，会继续保留更多控制点。</p>
              <p className="meta">适合场景：大地图草图用较大值，细修可下调。</p>
            </article>
            <article className="designer-doc-card">
              <h3>默认厚度</h3>
              <p>点击"根据天花板生成地面"时，会把当前天花板按这个厚度向下偏移，生成一份地面初稿。它不会自动跟随重绘，只在你手动触发时生效。</p>
              <p className="meta">适合场景：快速搭一个上下封闭的洞穴、隧道或漂浮平台实体。</p>
            </article>
            <article className="designer-doc-card">
              <h3>断点阈值</h3>
              <p>控制一个内部点需要离上边界或下边界多近，才会被视为断点。被识别为断点后，该点会切开实体段，中间未连接部分会被当成空洞。</p>
              <p className="meta">适合场景：想更容易切出悬崖、洞口断层时调大；想避免误触发切段时调小。</p>
            </article>
            <article className="designer-doc-card">
              <h3>场函数材质判定</h3>
              <p>当前运行时地面材质不是直接渐变，而是对每个采样点计算 `f(x,y)`。具体做法是：先求该 `x` 处的坡度绝对值 `slopeAbs`，再求该点距地表的相对深度 `depthRatio`，然后构造 `slopeFactor * depthRatio^alphaLocal`。其中 `alphaLocal = alphaBase + noise(x) * alphaJitter`，随机项只沿 `x` 方向连续变化。</p>
              <p className="meta">分类规则：`f(x,y) &lt; a1` 为草，`a1 ≤ f(x,y) &lt; a2` 为土，`f(x,y) ≥ a2` 为石；若坡度超过无草阈值，则草层直接禁用。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>推荐调参手感</strong>
            <span>先确定结构，再追求细节</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>草图阶段</h3>
              <p>建议使用较大的最小局部跨度和停止阈值，先让轮廓足够干净。这个阶段重点是确定地图节奏，而不是把每个小起伏都画出来。</p>
            </article>
            <article className="designer-doc-card">
              <h3>细修阶段</h3>
              <p>当主体结构稳定后，再降低跨度和停止阈值，提高转角权重，专门修悬崖边、台阶口、洞顶转折这些玩家感知最强的位置。</p>
            </article>
            <article className="designer-doc-card">
              <h3>避免误区</h3>
              <p>不要一开始就把参数调得很"灵"。过于敏感的抽稀会把手抖和偶然噪声也固化进边界，后续更难维护。</p>
            </article>
          </div>
        </section>
        </section>
      </GroundTuningPanel>
);
