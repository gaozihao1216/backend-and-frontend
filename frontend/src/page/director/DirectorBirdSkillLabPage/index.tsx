import { BirdSkillScratchEditor } from "./components/BirdSkillScratchEditor.js";
import { useDirectorBirdSkillLabPage } from "./hooks/useDirectorBirdSkillLabPage.js";
import type { DirectorBirdSkillLabPageProps } from "./objects/director-bird-skill-lab-page-types.js";

export const DirectorBirdSkillLabPage = ({ userId, onBack }: DirectorBirdSkillLabPageProps) => {
  const vm = useDirectorBirdSkillLabPage(userId);

  return (
    <section className="panel director-bird-skill-lab-page">
      <div className="feature-header director-bird-skill-lab-header">
        <div>
          <p className="eyebrow">Bird Skill Lab</p>
          <h2>鸟类技能实验室</h2>
          <p className="panel-copy">
            将设计师文案落实为可运行的点击技能，并为小鸟配置建模图。系统鸟与设计师鸟使用同一套积木模板。
          </p>
        </div>
        <div className="director-bird-skill-lab-header-actions">
          <div className="feature-pill">技能配置</div>
          <button type="button" className="secondary" onClick={onBack}>
            返回工作台
          </button>
        </div>
      </div>

      {vm.loading ? <p className="meta">正在加载鸟类列表...</p> : null}
      {vm.error ? <p className="feedback error">{vm.error}</p> : null}
      {vm.message ? <p className="feedback success">{vm.message}</p> : null}

      <div className="director-bird-skill-lab-layout">
        <aside className="feature-card director-bird-skill-list">
          <div className="director-bird-skill-section-head">
            <h3>鸟类列表</h3>
            <p className="meta">选择一只鸟开始配置技能积木与建模图。</p>
          </div>
          <div className="director-bird-skill-list-items">
            {vm.birds.map((bird) => (
              <button
                key={bird.birdType}
                type="button"
                className={`director-bird-skill-list-item${bird.birdType === vm.selectedBirdType ? " active" : ""}`}
                onClick={() => vm.setSelectedBirdType(bird.birdType)}
              >
                <span className="director-bird-skill-list-name">{bird.name}</span>
                <span className="director-bird-skill-list-meta">
                  <span>{bird.source === "designer" ? "设计师" : "系统"}</span>
                  <span className={bird.configured ? "is-configured" : "is-pending"}>
                    {bird.configured ? "已配置" : "未配置"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="director-bird-skill-editor-pane">
          {vm.selectedEntry && vm.skillSet ? (
            <BirdSkillScratchEditor
              entry={vm.selectedEntry}
              skillSet={vm.skillSet}
              modelImageUrl={vm.modelImageUrl}
              onSkillSetChange={vm.setSkillSet}
              onModelImageUrlChange={vm.setModelImageUrl}
              onSave={() => void vm.handleSave()}
              saving={vm.saving}
            />
          ) : (
            <section className="feature-card director-bird-skill-empty">
              <p className="panel-copy">请选择一只鸟开始配置技能。</p>
            </section>
          )}
        </div>
      </div>
    </section>
  );
};
