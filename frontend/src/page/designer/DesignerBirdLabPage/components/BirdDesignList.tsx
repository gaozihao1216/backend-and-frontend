import {
  birdDesignTabLabels,
  type DesignerBirdLabViewModel,
} from "../objects/designer-bird-lab-page-types.js";

type BirdDesignListProps = {
  vm: DesignerBirdLabViewModel;
  editable: boolean;
};

export const BirdDesignList = ({ vm, editable }: BirdDesignListProps) => (
  <section className={`feature-card designer-bird-list-card${editable ? "" : " designer-bird-list-card-full"}`}>
    <div className="designer-bird-section-head">
      <h3>{birdDesignTabLabels[vm.activeTab]}</h3>
      {editable ? <p className="meta">从列表中选择草稿继续编辑，或提交审核。</p> : null}
    </div>
    {vm.loading ? <p className="panel-copy">加载中…</p> : null}
    {!vm.loading && vm.designs.length === 0 ? <p className="panel-copy">暂无内容。</p> : null}
    <div className="designer-bird-card-grid">
      {vm.designs.map((design) => (
        <article key={design.id} className="mini-card designer-bird-card">
          <div className="designer-bird-card-layout">
            <img src={design.previewImageUrl} alt={design.name} />
            <div className="designer-bird-card-body">
              <div className="mini-card-header">
                <strong>{design.name}</strong>
                <span>{editable ? design.skillName : design.status}</span>
              </div>
              <p>{design.summary}</p>
              {editable ? (
                <>
                  <p className="meta">
                    攻击 {design.attack} / 冲击 {design.impact} / 速度 {design.speed}
                  </p>
                  {design.rejectionReason ? (
                    <p className="feedback error">驳回原因：{design.rejectionReason}</p>
                  ) : null}
                  <div className="designer-bird-card-actions">
                    <button type="button" className="secondary" onClick={() => vm.handleEdit(design)}>
                      继续编辑
                    </button>
                    <button
                      type="button"
                      disabled={vm.busyId === design.id}
                      onClick={() => void vm.handleSubmit(design.id)}
                    >
                      提交审核
                    </button>
                    {vm.activeTab === "draft" ? (
                      <button
                        type="button"
                        className="secondary"
                        disabled={vm.busyId === design.id}
                        onClick={() => void vm.handleDelete(design.id)}
                      >
                        作废
                      </button>
                    ) : null}
                  </div>
                </>
              ) : (
                <ul className="designer-bird-tier-list">
                  {design.tierSkills.map((skill, index) => (
                    <li key={index}>{index + 1} 阶：{skill}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);
