import { BirdPoolConfigPanel } from "./components/BirdPoolConfigPanel.js";
import { LevelPreviewCard } from "../../../components/level/LevelPreviewCard.js";
import { createSubmissionLevelSource } from "../../../level/function/level-repository.js";
import { LEVEL_NODE_DEFINITIONS } from "../../../objects/ui-customization/level-map-structure.js";
import { useDirectorLevelAssignmentPage } from "./hooks/useDirectorLevelAssignmentPage.js";
import type { DirectorLevelAssignmentPageProps } from "./objects/director-level-assignment-page-types.js";

export const DirectorLevelAssignmentPage = ({ userId, onBack }: DirectorLevelAssignmentPageProps) => {
  const vm = useDirectorLevelAssignmentPage(userId);

  return (
    <section className="panel director-level-assignment-page">
      <div className="feature-header">
        <div>
          <h2>关卡细节分配</h2>
          <p className="panel-copy">
            将管理员审核通过的设计师提案分配到关卡路径地图中的对应槽位，并由总监配置该关卡的鸟池规则。
          </p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回工作台
          </button>
          <button type="button" onClick={() => void vm.loadBoard()} disabled={vm.loading || vm.saving}>
            {vm.loading ? "刷新中..." : "刷新数据"}
          </button>
        </div>
      </div>

      {vm.error ? <p className="feedback error">{vm.error}</p> : null}
      {vm.message ? <p className="feedback success">{vm.message}</p> : null}

      <div className="director-level-assignment-layout">
        <section className="feature-card director-level-assignment-slots">
          <h3>关卡槽位</h3>
          <div className="director-level-assignment-slot-list">
            {LEVEL_NODE_DEFINITIONS.map((slot) => {
              const assigned = vm.assignmentMap.get(slot.suffix);
              const active = slot.suffix === vm.selectedSuffix;

              return (
                <button
                  key={slot.suffix}
                  type="button"
                  className={`director-level-assignment-slot${active ? " active" : ""}${assigned ? " assigned" : ""}`}
                  onClick={() => vm.setSelectedSuffix(slot.suffix)}
                >
                  <strong>{slot.label}</strong>
                  <span>{assigned ? assigned.submission.level.title : "未分配"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="feature-card director-level-assignment-detail">
          <h3>{vm.selectedSlot?.label ?? vm.selectedSuffix}</h3>
          {vm.selectedSlot ? <p className="panel-copy">{vm.selectedSlot.story}</p> : null}

          {vm.selectedAssignment ? (
            <div className="director-level-assignment-current">
              <div className="card-header">
                <strong>当前绑定提案</strong>
                <span>{vm.selectedAssignment.assignment.submissionId}</span>
              </div>
              <p className="meta">关卡 ID：{vm.selectedAssignment.submission.levelId}</p>
              <p className="meta">分配时间：{vm.selectedAssignment.assignment.assignedAt}</p>
              {vm.selectedAssignment.assignment.note ? (
                <p className="meta">备注：{vm.selectedAssignment.assignment.note}</p>
              ) : null}
              <BirdPoolConfigPanel
                pool={vm.birdPool}
                birdOptions={vm.board?.birdPoolOptions ?? []}
                onChange={vm.setBirdPool}
                disabled={vm.saving}
                title="关卡鸟池"
                description="该配置由总监维护，决定玩家在本槽位关卡中的可选鸟种与总发射次数。"
              />
              <div className="actions">
                <button type="button" onClick={() => void vm.handleUpdateBirdPool()} disabled={vm.saving}>
                  保存鸟池配置
                </button>
              </div>
              <LevelPreviewCard
                source={createSubmissionLevelSource(vm.selectedAssignment.submission.level)}
                birdPool={vm.birdPool}
              />
              <label>
                <span>废除备注（可选）</span>
                <textarea
                  value={vm.abolishNotes[vm.selectedAssignment.assignment.submissionId] ?? ""}
                  onChange={(event) => vm.setAbolishNote(vm.selectedAssignment?.assignment.submissionId ?? "", event.target.value)}
                  rows={2}
                  placeholder="例如：该提案与当前关卡规划不符"
                  disabled={vm.saving}
                />
              </label>
              <div className="actions">
                <button type="button" className="secondary" onClick={() => void vm.handleUnassign()} disabled={vm.saving}>
                  取消分配
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void vm.handleAbolish(vm.selectedAssignment?.assignment.submissionId ?? "")}
                  disabled={vm.saving}
                >
                  废除提案
                </button>
              </div>
            </div>
          ) : (
            <div className="director-level-assignment-form">
              <p className="meta">该槽位尚未绑定已通过审核的提案。</p>
              <label>
                <span>选择已通过提案</span>
                <select
                  value={vm.selectedSubmissionId}
                  onChange={(event) => vm.setSelectedSubmissionId(event.target.value)}
                  disabled={vm.pendingApproved.length === 0 || vm.saving}
                >
                  {vm.pendingApproved.length === 0 ? (
                    <option value="">暂无待分配提案</option>
                  ) : (
                    vm.pendingApproved.map((submission) => (
                      <option key={submission.id} value={submission.id}>
                        {submission.level.title} / {submission.id}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <BirdPoolConfigPanel
                pool={vm.birdPool}
                birdOptions={vm.board?.birdPoolOptions ?? []}
                onChange={vm.setBirdPool}
                disabled={vm.saving}
                title="关卡鸟池"
                description="分配提案时一并设定本关卡的鸟池规则。"
              />
              <label>
                <span>分配备注（可选）</span>
                <textarea
                  value={vm.assignmentNote}
                  onChange={(event) => vm.setAssignmentNote(event.target.value)}
                  rows={3}
                  placeholder="例如：作为第 2 关的风桥回旋细节版本"
                />
              </label>
              <div className="actions">
                <button
                  type="button"
                  onClick={() => void vm.handleAssign()}
                  disabled={vm.saving || vm.pendingApproved.length === 0 || !vm.selectedSubmissionId}
                >
                  分配到该关卡
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="feature-card director-level-assignment-queue">
          <h3>待分配提案 ({vm.pendingApproved.length})</h3>
          <p className="panel-copy">这些提案已由管理员审核通过，等待总监分配到具体关卡槽位。</p>
          <div className="list">
            {vm.pendingApproved.length === 0 ? <p className="meta">当前没有待分配提案。</p> : null}
            {vm.pendingApproved.map((submission) => (
              <article key={submission.id} className="card">
                <div className="card-header">
                  <strong>{submission.level.title}</strong>
                  <span>{submission.id}</span>
                </div>
                <p className="meta">{submission.level.description}</p>
                <p className="meta">提交者：{submission.submitterId}</p>
                {submission.reviewNote ? <p className="meta">审核备注：{submission.reviewNote}</p> : null}
                <LevelPreviewCard source={createSubmissionLevelSource(submission.level)} />
                <label>
                  <span>废除备注（可选）</span>
                  <textarea
                    value={vm.abolishNotes[submission.id] ?? ""}
                    onChange={(event) => vm.setAbolishNote(submission.id, event.target.value)}
                    rows={2}
                    placeholder="例如：该提案与当前关卡规划不符"
                    disabled={vm.saving}
                  />
                </label>
                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      vm.setSelectedSubmissionId(submission.id);
                      void vm.handleAbolish(submission.id);
                    }}
                    disabled={vm.saving}
                  >
                    废除提案
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
