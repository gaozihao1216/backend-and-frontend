import { useCallback, useEffect, useState } from "react";
import {
  createBirdDesign,
  deleteBirdDesign,
  listBirdDesigns,
  submitBirdDesign,
  updateBirdDesign,
} from "../../../../system/api/exports/designer-api.js";
import type { BirdDesign } from "../../../../objects/api/api-contracts.js";
import type { LevelStatus } from "../../../../objects/system/level-status.js";
import {
  createEmptyBirdDesignForm,
  type BirdDesignPortfolioTab,
  type DesignerBirdLabViewModel,
} from "../objects/designer-bird-lab-page-types.js";

export const useDesignerBirdLab = (userId: string): DesignerBirdLabViewModel => {
  const [activeTab, setActiveTab] = useState<BirdDesignPortfolioTab>("draft");
  const [designs, setDesigns] = useState<BirdDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(createEmptyBirdDesignForm);
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
    setForm(createEmptyBirdDesignForm());
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

  return {
    activeTab,
    designs,
    loading,
    busyId,
    error,
    notice,
    editingId,
    form,
    tagInput,
    setActiveTab,
    setForm,
    setTagInput,
    resetForm,
    handleSave,
    handleEdit,
    handleSubmit,
    handleDelete,
    updateTierSkill,
    applyTags,
  };
};
