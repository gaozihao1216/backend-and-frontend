import { useCallback, useEffect, useMemo, useState } from "react";
import {
  assignLevelSlot,
  abolishDirectorSubmission,
  getDirectorLevelAssignmentBoard,
  unassignLevelSlot,
  updateLevelSlotBirdPool,
} from "../../../../system/api/exports/index.js";
import type { DirectorLevelAssignmentBoard } from "../../../../objects/admin/director/level_assignment/board/director-level-assignment-board.js";
import type { LevelSlotAssignmentDetail } from "../../../../objects/admin/director/level_assignment/assignment/level-slot-assignment.js";
import { DEFAULT_BIRD_POOL, type BirdPool } from "../../../../objects/level/inventory/bird-pool.js";
import { LEVEL_NODE_DEFINITIONS } from "../../../../objects/ui-customization/level-map-structure.js";

const buildAssignmentMap = (assignments: LevelSlotAssignmentDetail[]) =>
  new Map(assignments.map((entry) => [entry.assignment.levelSuffix, entry]));

export const useDirectorLevelAssignmentPage = (userId: string) => {
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

  const setAbolishNote = (submissionId: string, note: string) => {
    setAbolishNotes((current) => ({
      ...current,
      [submissionId]: note,
    }));
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

  return {
    board,
    selectedSuffix,
    selectedSubmissionId,
    assignmentNote,
    birdPool,
    abolishNotes,
    loading,
    saving,
    error,
    message,
    assignmentMap,
    selectedSlot,
    selectedAssignment,
    pendingApproved,
    setSelectedSuffix,
    setSelectedSubmissionId,
    setAssignmentNote,
    setBirdPool,
    setAbolishNote,
    loadBoard,
    handleAssign,
    handleUpdateBirdPool,
    handleUnassign,
    handleAbolish,
  };
};
