import type { DesignerBirdLabViewModel } from "../objects/designer-bird-lab-page-types.js";

type BirdDesignFormProps = {
  vm: DesignerBirdLabViewModel;
};

export const BirdDesignForm = ({ vm }: BirdDesignFormProps) => (
  <section className="feature-card designer-bird-form-card">
    <div className="designer-bird-section-head">
      <h3>{vm.editingId ? "编辑鸟类设计" : "新建鸟类设计"}</h3>
      <p className="meta">填写基础信息、战斗数值与三阶技能描述。</p>
    </div>

    <div className="designer-bird-form-section">
      <h4>基础信息</h4>
      <label>
        <span>名称</span>
        <input value={vm.form.name} onChange={(event) => vm.setForm((current) => ({ ...current, name: event.target.value }))} />
      </label>
      <label>
        <span>简介</span>
        <textarea rows={3} value={vm.form.summary} onChange={(event) => vm.setForm((current) => ({ ...current, summary: event.target.value }))} />
      </label>
      <label>
        <span>技能名称</span>
        <input value={vm.form.skillName} onChange={(event) => vm.setForm((current) => ({ ...current, skillName: event.target.value }))} />
      </label>
    </div>

    <div className="designer-bird-form-section">
      <h4>战斗数值</h4>
      <div className="feature-inline-fields designer-bird-stat-fields">
        <label>
          <span>攻击</span>
          <input type="number" value={vm.form.attack} onChange={(event) => vm.setForm((current) => ({ ...current, attack: Number(event.target.value) }))} />
        </label>
        <label>
          <span>冲击</span>
          <input type="number" value={vm.form.impact} onChange={(event) => vm.setForm((current) => ({ ...current, impact: Number(event.target.value) }))} />
        </label>
        <label>
          <span>速度</span>
          <input type="number" value={vm.form.speed} onChange={(event) => vm.setForm((current) => ({ ...current, speed: Number(event.target.value) }))} />
        </label>
      </div>
    </div>

    <div className="designer-bird-form-section">
      <h4>三阶技能</h4>
      {vm.form.tierSkills.map((skill, index) => (
        <label key={index}>
          <span>{index + 1} 阶技能</span>
          <textarea rows={2} value={skill} onChange={(event) => vm.updateTierSkill(index, event.target.value)} />
        </label>
      ))}
    </div>

    <div className="designer-bird-form-section">
      <h4>机制标签</h4>
      <label>
        <span>标签（逗号分隔）</span>
        <input value={vm.tagInput} onChange={(event) => vm.setTagInput(event.target.value)} onBlur={vm.applyTags} />
      </label>
    </div>

    <div className="designer-bird-form-actions">
      <button type="button" onClick={() => void vm.handleSave()}>
        {vm.editingId ? "保存修改" : "保存草稿"}
      </button>
      {vm.editingId ? (
        <button type="button" className="secondary" onClick={vm.resetForm}>
          取消编辑
        </button>
      ) : null}
    </div>
  </section>
);
