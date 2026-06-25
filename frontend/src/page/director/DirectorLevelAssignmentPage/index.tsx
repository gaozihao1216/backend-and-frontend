import { useCallback, useEffect, useMemo, useState } from "react";
import {
  assignLevelSlot,
  abolishDirectorSubmission,
  getDirectorLevelAssignmentBoard,
  unassignLevelSlot,
  updateLevelSlotBirdPool,
} from "../../../system/api/exports/index.js";
import { BirdPoolConfigPanel } from "./components/BirdPoolConfigPanel.js";
import { LevelPreviewCard } from "../../../components/level/LevelPreviewCard.js";
import { createSubmissionLevelSource } from "../../../lib/level-repository.js";
import type { DirectorLevelAssignmentBoard } from "../../../objects/admin/director/level_assignment/board/director-level-assignment-board.js";
import type { LevelSlotAssignmentDetail } from "../../../objects/admin/director/level_assignment/assignment/level-slot-assignment.js";
import { DEFAULT_BIRD_POOL, type BirdPool } from "../../../objects/level/inventory/bird-pool.js";
import { LEVEL_NODE_DEFINITIONS } from "../../../objects/ui-customization/level-map-structure.js";

type DirectorLevelAssignmentPageProps = {
  userId: string;
  onBack: () => void;
};

const buildAssignmentMap = (assignments: LevelSlotAssignmentDetail[]) =>
  new Map(assignments.map((entry) => [entry.assignment.levelSuffix, entry]));

export const DirectorLevelAssignmentPage = ({ userId, onBack }: DirectorLevelAssignmentPageProps) => {
  const [board, setBoard] = useState<DirectorLevelAssignmentBoard | null>(null);
  const [selectedSuffix, setSelectedSuffix] = useState(LEVEL_NODE_DEFINITIONS[0]?.suffix ?? "level01");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const [assignmentNote, setAssignmentNote] = useState("");
  const [birdPool, setBirdPool] = useState<BirdPool>(DEFAULT_BIRD_POOL);
  const [abolishNotes, setAbolishNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const assignmentMap = useMemo(
    () => buildAssignmentMap(board?.assignments ?? []),
    [board?.assignments],
  );

  const selectedSlot = LEVEL_NODE_DEFINITIONS.find((slot) => slot.suffix === selectedSuffix) ?? null;
  const selectedAssignment = assignmentMap.get(selectedSuffix) ?? null;
  const pendingApproved = board?.pendingApproved ?? [];

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const nextBoard = await getDirectorLevelAssignmentBoard(userId);
      setBoard(nextBoard);
      setSelectedSubmissionId((current) => {
        if (current && nextBoard.pendingApproved.some((submission) => submission.id === current)) {
          return current;
        }
        return nextBoard.pendingApproved[0]?.id ?? "";
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载关卡分配数据失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  useEffect(() => {
    setBirdPool(selectedAssignment?.assignment.birdPool ?? DEFAULT_BIRD_POOL);
  }, [selectedSuffix, selectedAssignment?.assignment.id, selectedAssignment?.assignment.birdPool]);

  const handleAssign = async () => {
    if (!selectedSubmissionId) {
      setMessage("请先选择一个已通过审核的提案。");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const note = assignmentNote.trim();
      await assignLevelSlot(userId, selectedSuffix, {
        submissionId: selectedSubmissionId,
        birdPool,
        ...(note ? { note } : {}),
      });
      setAssignmentNote("");
      setMessage(`已将提案分配到 ${selectedSlot?.label ?? selectedSuffix}，并写入鸟池配置。`);
      await loadBoard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "分配提案失败");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBirdPool = async () => {
    if (!selectedAssignment) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateLevelSlotBirdPool(userId, selectedSuffix, { birdPool });
      setMessage(`已更新 ${selectedSlot?.label ?? selectedSuffix} 的鸟池配置。`);
      await loadBoard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "更新鸟池配置失败");
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await unassignLevelSlot(userId, selectedSuffix);
      setMessage(`已取消 ${selectedSlot?.label ?? selectedSuffix} 的提案绑定。`);
      await loadBoard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "取消分配失败");
    } finally {
      setSaving(false);
    }
  };

  const handleAbolish = async (submissionId: string) => {
    const note = abolishNotes[submissionId]?.trim();
    const confirmed = window.confirm("确定要废除该提案吗？废除后将无法继续分配，并会解除已有槽位绑定。");
    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await abolishDirectorSubmission(userId, submissionId, note ? { note } : {});
      setAbolishNotes((current) => {
        const next = { ...current };
        delete next[submissionId];
        return next;
      });
      setMessage("提案已废除。");
      await loadBoard();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "废除提案失败");
    } finally {
      setSaving(false);
    }
  };

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
          <button type="button" onClick={() => void loadBoard()} disabled={loading || saving}>
            {loading ? "刷新中..." : "刷新数据"}
          </button>
        </div>
      </div>

      {error ? <p className="feedback error">{error}</p> : null}
      {message ? <p className="feedback success">{message}</p> : null}

      <div className="director-level-assignment-layout">
        <section className="feature-card director-level-assignment-slots">
          <h3>关卡槽位</h3>
          <div className="director-level-assignment-slot-list">
            {LEVEL_NODE_DEFINITIONS.map((slot) => {
              const assigned = assignmentMap.get(slot.suffix);
              const active = slot.suffix === selectedSuffix;

              return (
                <button
                  key={slot.suffix}
                  type="button"
                  className={`director-level-assignment-slot${active ? " active" : ""}${assigned ? " assigned" : ""}`}
                  onClick={() => setSelectedSuffix(slot.suffix)}
                >
                  <strong>{slot.label}</strong>
                  <span>{assigned ? assigned.submission.level.title : "未分配"}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="feature-card director-level-assignment-detail">
          <h3>{selectedSlot?.label ?? selectedSuffix}</h3>
          {selectedSlot ? <p className="panel-copy">{selectedSlot.story}</p> : null}

          {selectedAssignment ? (
            <div className="director-level-assignment-current">
              <div className="card-header">
                <strong>当前绑定提案</strong>
                <span>{selectedAssignment.assignment.submissionId}</span>
              </div>
              <p className="meta">关卡 ID：{selectedAssignment.submission.levelId}</p>
              <p className="meta">分配时间：{selectedAssignment.assignment.assignedAt}</p>
              {selectedAssignment.assignment.note ? (
                <p className="meta">备注：{selectedAssignment.assignment.note}</p>
              ) : null}
              <BirdPoolConfigPanel
                pool={birdPool}
                birdOptions={board?.birdPoolOptions ?? []}
                onChange={setBirdPool}
                disabled={saving}
                title="关卡鸟池"
                description="该配置由总监维护，决定玩家在本槽位关卡中的可选鸟种与总发射次数。"
              />
              <div className="actions">
                <button type="button" onClick={() => void handleUpdateBirdPool()} disabled={saving}>
                  保存鸟池配置
                </button>
              </div>
              <LevelPreviewCard
                source={createSubmissionLevelSource(selectedAssignment.submission.level)}
                birdPool={birdPool}
              />
              <label>
                <span>废除备注（可选）</span>
                <textarea
                  value={abolishNotes[selectedAssignment.assignment.submissionId] ?? ""}
                  onChange={(event) =>
                    setAbolishNotes((current) => ({
                      ...current,
                      [selectedAssignment.assignment.submissionId]: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="例如：该提案与当前关卡规划不符"
                  disabled={saving}
                />
              </label>
              <div className="actions">
                <button type="button" className="secondary" onClick={() => void handleUnassign()} disabled={saving}>
                  取消分配
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void handleAbolish(selectedAssignment.assignment.submissionId)}
                  disabled={saving}
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
                  value={selectedSubmissionId}
                  onChange={(event) => setSelectedSubmissionId(event.target.value)}
                  disabled={pendingApproved.length === 0 || saving}
                >
                  {pendingApproved.length === 0 ? (
                    <option value="">暂无待分配提案</option>
                  ) : (
                    pendingApproved.map((submission) => (
                      <option key={submission.id} value={submission.id}>
                        {submission.level.title} / {submission.id}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <BirdPoolConfigPanel
                pool={birdPool}
                birdOptions={board?.birdPoolOptions ?? []}
                onChange={setBirdPool}
                disabled={saving}
                title="关卡鸟池"
                description="分配提案时一并设定本关卡的鸟池规则。"
              />
              <label>
                <span>分配备注（可选）</span>
                <textarea
                  value={assignmentNote}
                  onChange={(event) => setAssignmentNote(event.target.value)}
                  rows={3}
                  placeholder="例如：作为第 2 关的风桥回旋细节版本"
                />
              </label>
              <div className="actions">
                <button
                  type="button"
                  onClick={() => void handleAssign()}
                  disabled={saving || pendingApproved.length === 0 || !selectedSubmissionId}
                >
                  分配到该关卡
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="feature-card director-level-assignment-queue">
          <h3>待分配提案 ({pendingApproved.length})</h3>
          <p className="panel-copy">这些提案已由管理员审核通过，等待总监分配到具体关卡槽位。</p>
          <div className="list">
            {pendingApproved.length === 0 ? <p className="meta">当前没有待分配提案。</p> : null}
            {pendingApproved.map((submission) => (
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
                    value={abolishNotes[submission.id] ?? ""}
                    onChange={(event) =>
                      setAbolishNotes((current) => ({
                        ...current,
                        [submission.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="例如：该提案与当前关卡规划不符"
                    disabled={saving}
                  />
                </label>
                <div className="actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setSelectedSubmissionId(submission.id);
                      void handleAbolish(submission.id);
                    }}
                    disabled={saving}
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
