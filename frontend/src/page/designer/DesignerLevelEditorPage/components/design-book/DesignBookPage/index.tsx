import { DesignBookPanel } from "../DesignBookPanel.js";

type DesignBookPageProps = {
  onExitDesignBook?: (() => void) | undefined;
};

export const DesignBookPage = ({ onExitDesignBook }: DesignBookPageProps) => (
  <DesignBookPanel>
    <section className="panel designer-workspace-panel designer-doc-page">
        <div className="actions">
          <button type="button" className="secondary" onClick={onExitDesignBook}>
            返回设计页
          </button>
        </div>
        <div className="designer-doc-hero">
          <div>
            <p className="eyebrow">designer/design/design_book</p>
            <h2>设计指导</h2>
            <p className="panel-copy">
              这个页面用于集中说明地形编辑器的工作方式、交互规则和数据约束。主设计页只保留动作入口，这里负责解释为什么这么设计，以及正确的使用顺序。
            </p>
          </div>
          <div className="designer-doc-callout">
            <strong>当前地形模型</strong>
            <p>地形由 `groundBoundary` 和 `voidSpans` 组成，`ceilingBoundary` 是可选项。默认可以没有天花板；一旦绘制出来，它会和地面一样生成实体碰撞。悬崖虚空用于把某段地面切成真实空区。</p>
          </div>
        </div>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>建议流程</strong>
            <span>先形体，后玩法，最后验证</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>1. 先画天花板</h3>
              <p>如果这个关卡需要洞顶、山洞上壁、压顶岩层之类的上方阻挡结构，再去画天花板。默认情况下可以完全没有这一层。</p>
            </article>
            <article className="designer-doc-card">
              <h3>2. 再画地面</h3>
              <p>地面负责承载站立、滚落和接触反馈。你可以直接手绘，也可以先用"根据天花板生成地面"做一份偏移初稿，再局部精修。</p>
            </article>
            <article className="designer-doc-card">
              <h3>3. 切悬崖虚空</h3>
              <p>在已经成型的地面上切掉若干横向区间，制造断崖、深坑、悬浮平台之间的空档。这个操作不是挖洞多边形，而是把一段地面变成虚空。</p>
            </article>
            <article className="designer-doc-card">
              <h3>4. 摆放实体</h3>
              <p>当天花板、地面和虚空段稳定后，再进入第二阶段布置木块、石块、玻璃和 pig，避免频繁返工碰撞基础。</p>
            </article>
            <article className="designer-doc-card">
              <h3>5. 最后试玩验证</h3>
              <p>只在主要几何关系确定后再开预览。这样更容易把问题归因到具体结构，而不是在草图阶段被频繁的物理重建打断。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>模式说明</strong>
            <span>三个模式分别改三种数据</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>上边界编辑</h3>
              <p>这里的"上边界"是地图天花板，不是地形顶面。它用于描述洞顶、岩壁顶缘、压顶层等上方阻挡结构，且默认可以不存在。</p>
              <p className="meta">对应数据：`terrain.ceilingBoundary`</p>
            </article>
            <article className="designer-doc-card">
              <h3>下边界编辑</h3>
              <p>这里的"下边界"是玩家可接触的地面轮廓。它定义站立面、坡面、坑缘、平台底部支撑等主要落脚结构。</p>
              <p className="meta">对应数据：`terrain.groundBoundary`</p>
            </article>
            <article className="designer-doc-card">
              <h3>镂空 / 悬崖虚空</h3>
              <p>该模式通过横向区间切除地面实体，形成真正的空白带。被切掉的范围不再提供地面碰撞，两侧自然形成断边和悬崖。</p>
              <p className="meta">对应数据：`terrain.voidSpans`</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>交互规则</strong>
            <span>画布中的主要编辑行为</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>局部放大</h3>
              <p>缩放链位于编辑画布外，可连续调整局部放大倍率。倍率映射不是线性的，而是指数形式，因此 100% 到 200% 区间更容易细调。</p>
              <p className="meta">缩放链会在 100% / 200% / 400% / 800% 附近自动吸附；"复位"按钮会一直显示，便于随时回到 100%。</p>
            </article>
            <article className="designer-doc-card">
              <h3>框选放大与平移</h3>
              <p>按住 Ctrl 在画布中拖拽，可以快速框选一个局部区域并放大到该范围。进入放大状态后，滚轮用于上下平移，Shift + 滚轮用于左右平移。</p>
              <p className="meta">建议先用框选放大定位区域，再用缩放链做精细倍率调整。</p>
            </article>
            <article className="designer-doc-card">
              <h3>重绘边界</h3>
              <p>在边界编辑模式下，于画布空白区域拖拽即可重绘当前边界。系统会把手绘轨迹抽稀，再转换为折线或贝塞尔控制点。</p>
            </article>
            <article className="designer-doc-card">
              <h3>点编辑</h3>
              <p>选中控制点后可以重排或删除中间点。首尾点承担左右封边职责，通常不建议作为普通中间点处理。</p>
            </article>
            <article className="designer-doc-card">
              <h3>网格吸附</h3>
              <p>按住 Alt 会临时显示网格并启用吸附。适合做规则结构、对齐平台、控制断崖边距，也适合第二阶段摆放物体时保持整洁。</p>
            </article>
            <article className="designer-doc-card">
              <h3>悬崖切除</h3>
              <p>进入"悬崖虚空"模式后横向拖拽，即可生成一个 void span。它本质是 x 区间切除，不要求用户画闭合面。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>碰撞与几何约束</strong>
            <span>当前版本的实现边界</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>天花板与地面同类处理</h3>
              <p>运行时会把天花板和地面都当成"地形边界实体"来建模，渲染和碰撞只是在法线方向与视觉语义上不同，本质逻辑是一致的。</p>
            </article>
            <article className="designer-doc-card">
              <h3>虚空段优先切地面</h3>
              <p>当前虚空段主要影响地面实体切分，用于形成深坑、断崖与平台空档。它不会单独修改天花板轮廓。</p>
            </article>
            <article className="designer-doc-card">
              <h3>早期碰撞简化</h3>
              <p>当前碰撞使用简化边界段构建，重点保证编辑迭代效率。后续如果要支持更复杂的体积判定，再考虑引入更完整的地形碰撞模型。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>材质场函数说明</strong>
            <span>运行时地表颜色不是固定渐变</span>
          </div>
          <div className="designer-doc-grid">
            <article className="designer-doc-card">
              <h3>整体思路</h3>
              <p>当前运行时的地面材质不是直接从绿色渐变到棕色，而是对每个采样点计算一个场函数 `f(x,y)`，再依据阈值判断当前点属于草、土还是石。这样可以把坡度、深度和局部随机变化统一进一个可调模型里。</p>
            </article>
            <article className="designer-doc-card">
              <h3>深度项</h3>
              <p>对当前采样点先计算该 `x` 位置地表高度 `surfaceY(x)`，再计算当前点到地表的相对深度 `depthRatio`。深度项使用幂次而不是指数，形式接近 `depthRatio^alphaLocal`，其中 `alphaLocal` 会被连续噪声场轻微扰动。</p>
            </article>
            <article className="designer-doc-card">
              <h3>斜率项</h3>
              <p>坡度绝对值 `|slope|` 先进入一个 sigmoid 函数 `S(slope)`，当前实现中 `Sigmoid A / Beta / Gamma` 分别控制整体高度、曲线陡峭程度和拐点位置。随后还会叠加 `cliffFactor` 和 `noGrassSlope` 的附加影响，让悬崖区域更快偏向岩石。</p>
            </article>
            <article className="designer-doc-card">
              <h3>分类阈值</h3>
              <p>最终场函数形式接近 `f(x,y) = slopeFactor * depthRatio^alphaLocal`。然后用 `a1 / a2` 做离散分类：`f &lt; a1` 判为草，`a1 ≤ f &lt; a2` 判为土，`f ≥ a2` 判为石。当坡度超过 `noGrassSlope` 时，草阈值会被直接禁用。</p>
            </article>
            <article className="designer-doc-card">
              <h3>随机信号</h3>
              <p>随机信号已经退化成一维连续噪声，只沿 `x` 方向变化，并满足空间局域性。它不会直接决定颜色类别，而是用于扰动 `alphaLocal`，从而改变局部地层推进速度；`noiseStrength` 则只影响最终显示明暗，不直接影响草土石分类。</p>
            </article>
            <article className="designer-doc-card">
              <h3>草土分界曲线</h3>
              <p>为了避免粗采样方块直接暴露在最终视觉里，运行时会先按较大步长扫描每个 `x` 列中 `f(x,y)=a1` 的过渡点，再把这些点经过多轮局部平滑后拟合成一条连续曲线，用它作为草层和土层之间的分界。</p>
              <p className="meta">`grassCurveSampleStep` 越小越贴近原始分层、但点更多；`grassCurveSmoothingPasses` 越大越顺滑、但会更概括。</p>
            </article>
            <article className="designer-doc-card">
              <h3>土石分界曲线</h3>
              <p>同样地，运行时也会扫描 `f(x,y)=a2` 的过渡点，并生成土层与石层之间的分界线。最终渲染不再逐个小格判色，而是直接对"地表到草土线"、"草土线到土石线"、"土石线到底边"三段带状区域分别填色。</p>
              <p className="meta">这样可以把场函数的计算集中在边界提取阶段，后续只按三条曲线之间的区域做填充，明显减轻逐像素或逐方块渲染负担。</p>
            </article>
            <article className="designer-doc-card">
              <h3>建议调参顺序</h3>
              <p>先调 `Sigmoid Gamma` 和 `Cliff Start / End`，确定什么坡度开始显著石化；再调 `noGrassSlope` 控制悬崖彻底禁草的时机；然后用 `a1 / a2 / alphaBase / alphaJitter` 修草土石分层厚薄与局部变化；最后再用 `grassCurveSampleStep / grassCurveSmoothingPasses` 收草土边界的视觉手感。</p>
            </article>
          </div>
        </section>
        <section className="designer-doc-section">
          <div className="card-header">
            <strong>快捷键</strong>
            <span>设计器常用操作</span>
          </div>
          <div className="designer-doc-inline-list">
            <span>Ctrl / Cmd + Z：撤销</span>
            <span>Ctrl / Cmd + Y：重做</span>
            <span>Ctrl / Cmd + C / X / V：复制、剪切、粘贴实体</span>
            <span>Delete：删除选中实体</span>
            <span>Shift：追加选择</span>
            <span>Alt：显示网格并启用网格吸附</span>
          </div>
        </section>
        </section>
      </DesignBookPanel>
);
