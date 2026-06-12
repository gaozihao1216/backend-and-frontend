import { useCallback, useEffect, useState } from "react";
import {
  createBirdDesign,
  deleteBirdDesign,
  listBirdDesigns,
  submitBirdDesign,
  updateBirdDesign,
} from "../../api/designer-api.js";
import type { BirdDesign, BirdDesignInput } from "../../api/api-contracts.js";
import type { LevelStatus } from "../../objects/system/level-status.js";

type DesignerBirdLabPageProps = {
  userId: string;
  onBack: () => void;
};

type PortfolioTab = "draft" | "pending_review" | "published" | "rejected";

const tabLabels: Record<PortfolioTab, string> = {
  draft: "草稿",
  pending_review: "待审核",
  published: "已发布",
  rejected: "已驳回",
};

const emptyForm = (): BirdDesignInput => ({
  name: "",
  summary: "",
  skillName: "",
  attack: 80,
  impact: 70,
  speed: 60,
  tierSkills: ["一阶技能描述", "二阶技能描述", "三阶技能描述"],
  mechanismTags: [],
});

export const DesignerBirdLabPage = ({ userId, onBack }: DesignerBirdLabPageProps) => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>("draft");
  const [designs, setDesigns] = useState<BirdDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BirdDesignInput>(emptyForm);
  const [tagInput, setTagInput] = useState("");

  const loadDesigns = useCallback(async (status: LevelStatus) => {
    setLoading(true);
    setError("");
    try {
      setDesigns(await listBirdDesigns(userId, { status }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载鸟类设计失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadDesigns(activeTab);
  }, [activeTab, loadDesigns]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setTagInput("");
  };

  const handleSave = async () => {
    setError("");
    setNotice("");
    try {
      if (editingId) {
        await updateBirdDesign(userId, editingId, form);
        setNotice("鸟类设计已更新");
      } else {
        await createBirdDesign(userId, form);
        setNotice("鸟类设计已保存为草稿");
      }
      resetForm();
      await loadDesigns(activeTab);
      if (!editingId) {
        setActiveTab("draft");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败");
    }
  };

  const handleEdit = (design: BirdDesign) => {
    setEditingId(design.id);
    setForm({
      name: design.name,
      summary: design.summary,
      skillName: design.skillName,
      attack: design.attack,
      impact: design.impact,
      speed: design.speed,
      tierSkills: design.tierSkills,
      previewImageUrl: design.previewImageUrl,
      mechanismTags: design.mechanismTags,
    });
    setTagInput(design.mechanismTags.join(", "));
    setActiveTab("draft");
  };

  const handleSubmit = async (designId: string) => {
    setBusyId(designId);
    setError("");
    setNotice("");
    try {
      await submitBirdDesign(userId, designId);
      setNotice("已提交审核");
      await loadDesigns(activeTab);
      setActiveTab("pending_review");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "提交失败");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (designId: string) => {
    if (!window.confirm("确定作废这份草稿吗？")) {
      return;
    }
    setBusyId(designId);
    setError("");
    try {
      await deleteBirdDesign(userId, designId);
      setNotice("草稿已作废");
      if (editingId === designId) {
        resetForm();
      }
      await loadDesigns(activeTab);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "作废失败");
    } finally {
      setBusyId(null);
    }
  };

  const updateTierSkill = (index: number, value: string) => {
    setForm((current) => ({
      ...current,
      tierSkills: current.tierSkills.map((skill, skillIndex) => (skillIndex === index ? value : skill)),
    }));
  };

  const applyTags = () => {
    const tags = tagInput.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean);
    setForm((current) => ({ ...current, mechanismTags: tags }));
  };

  return (
    <section className="panel designer-bird-lab-page">
      <div className="feature-header designer-bird-lab-header">
        <div>
          <p className="eyebrow">Bird Lab</p>
          <h2>鸟类开发实验室</h2>
          <p className="panel-copy">设计新鸟种的基础数值与三阶技能，提交后由管理员审核发布。</p>
        </div>
        <div className="designer-bird-lab-header-actions">
          <div className="feature-pill">设计实验室</div>
          <button type="button" className="secondary" onClick={onBack}>
            返回主页
          </button>
        </div>
      </div>

      {error ? <p className="feedback error">{error}</p> : null}
      {notice ? <p className="feedback success">{notice}</p> : null}

      <div className="designer-bird-tabs" role="tablist" aria-label="鸟类设计状态">
        {(Object.keys(tabLabels) as PortfolioTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "secondary is-active" : "secondary"}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {(activeTab === "draft" || activeTab === "rejected") ? (
        <div className="designer-bird-lab-layout">
          <section className="feature-card designer-bird-form-card">
            <div className="designer-bird-section-head">
              <h3>{editingId ? "编辑鸟类设计" : "新建鸟类设计"}</h3>
              <p className="meta">填写基础信息、战斗数值与三阶技能描述。</p>
            </div>

            <div className="designer-bird-form-section">
              <h4>基础信息</h4>
              <label>
                <span>名称</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label>
                <span>简介</span>
                <textarea rows={3} value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} />
              </label>
              <label>
                <span>技能名称</span>
                <input value={form.skillName} onChange={(event) => setForm((current) => ({ ...current, skillName: event.target.value }))} />
              </label>
            </div>

            <div className="designer-bird-form-section">
              <h4>战斗数值</h4>
              <div className="feature-inline-fields designer-bird-stat-fields">
                <label>
                  <span>攻击</span>
                  <input type="number" value={form.attack} onChange={(event) => setForm((current) => ({ ...current, attack: Number(event.target.value) }))} />
                </label>
                <label>
                  <span>冲击</span>
                  <input type="number" value={form.impact} onChange={(event) => setForm((current) => ({ ...current, impact: Number(event.target.value) }))} />
                </label>
                <label>
                  <span>速度</span>
                  <input type="number" value={form.speed} onChange={(event) => setForm((current) => ({ ...current, speed: Number(event.target.value) }))} />
                </label>
              </div>
            </div>

            <div className="designer-bird-form-section">
              <h4>三阶技能</h4>
              {form.tierSkills.map((skill, index) => (
                <label key={index}>
                  <span>{index + 1} 阶技能</span>
                  <textarea rows={2} value={skill} onChange={(event) => updateTierSkill(index, event.target.value)} />
                </label>
              ))}
            </div>

            <div className="designer-bird-form-section">
              <h4>机制标签</h4>
              <label>
                <span>标签（逗号分隔）</span>
                <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} onBlur={applyTags} />
              </label>
            </div>

            <div className="designer-bird-form-actions">
              <button type="button" onClick={() => void handleSave()}>
                {editingId ? "保存修改" : "保存草稿"}
              </button>
              {editingId ? (
                <button type="button" className="secondary" onClick={resetForm}>
                  取消编辑
                </button>
              ) : null}
            </div>
          </section>

          <section className="feature-card designer-bird-list-card">
            <div className="designer-bird-section-head">
              <h3>{tabLabels[activeTab]}</h3>
              <p className="meta">从列表中选择草稿继续编辑，或提交审核。</p>
            </div>
            {loading ? <p className="panel-copy">加载中…</p> : null}
            {!loading && designs.length === 0 ? <p className="panel-copy">暂无内容。</p> : null}
            <div className="designer-bird-card-grid">
              {designs.map((design) => (
                <article key={design.id} className="mini-card designer-bird-card">
                  <div className="designer-bird-card-layout">
                    <img src={design.previewImageUrl} alt={design.name} />
                    <div className="designer-bird-card-body">
                      <div className="mini-card-header">
                        <strong>{design.name}</strong>
                        <span>{design.skillName}</span>
                      </div>
                      <p>{design.summary}</p>
                      <p className="meta">
                        攻击 {design.attack} / 冲击 {design.impact} / 速度 {design.speed}
                      </p>
                      {design.rejectionReason ? (
                        <p className="feedback error">驳回原因：{design.rejectionReason}</p>
                      ) : null}
                      <div className="designer-bird-card-actions">
                        <button type="button" className="secondary" onClick={() => handleEdit(design)}>
                          继续编辑
                        </button>
                        <button
                          type="button"
                          disabled={busyId === design.id}
                          onClick={() => void handleSubmit(design.id)}
                        >
                          提交审核
                        </button>
                        {activeTab === "draft" ? (
                          <button
                            type="button"
                            className="secondary"
                            disabled={busyId === design.id}
                            onClick={() => void handleDelete(design.id)}
                          >
                            作废
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="feature-card designer-bird-list-card designer-bird-list-card-full">
          <div className="designer-bird-section-head">
            <h3>{tabLabels[activeTab]}</h3>
          </div>
          {loading ? <p className="panel-copy">加载中…</p> : null}
          {!loading && designs.length === 0 ? <p className="panel-copy">暂无内容。</p> : null}
          <div className="designer-bird-card-grid">
            {designs.map((design) => (
              <article key={design.id} className="mini-card designer-bird-card">
                <div className="designer-bird-card-layout">
                  <img src={design.previewImageUrl} alt={design.name} />
                  <div className="designer-bird-card-body">
                    <div className="mini-card-header">
                      <strong>{design.name}</strong>
                      <span>{design.status}</span>
                    </div>
                    <p>{design.summary}</p>
                    <ul className="designer-bird-tier-list">
                      {design.tierSkills.map((skill, index) => (
                        <li key={index}>{index + 1} 阶：{skill}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
};
