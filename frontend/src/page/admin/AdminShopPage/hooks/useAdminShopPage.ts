import { useEffect, useState } from "react";
import type {
  CreateShopItemRequestBody,
  ShopItem,
  UpdateShopItemRequestBody,
} from "../../../../objects/api/api-contracts.js";
import {
  createShopItem,
  deactivateShopItem,
  listAdminShopItems,
  updateShopItem,
} from "../../../../system/api/exports/index.js";

const emptyCreateDraft = (): CreateShopItemRequestBody => ({
  name: "",
  description: "",
  price: 100,
  currency: "coins",
  catalogIndex: 0,
  active: true,
  sortOrder: 0,
});

const toUpdateDraft = (item: ShopItem): UpdateShopItemRequestBody => ({
  name: item.name,
  description: item.description,
  price: item.price,
  currency: item.currency,
  catalogIndex: item.catalogIndex,
  active: item.active,
  sortOrder: item.sortOrder,
});

export const useAdminShopPage = (userId: string) => {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [createDraft, setCreateDraft] = useState<CreateShopItemRequestBody>(emptyCreateDraft);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<UpdateShopItemRequestBody | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadItems = async () => {
    setLoading(true);
    setError("");

    try {
      const nextItems = await listAdminShopItems(userId);
      setItems(nextItems);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载商店商品失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, [userId]);

  const handleCreate = async () => {
    setError("");
    setMessage("");

    try {
      await createShopItem(userId, createDraft);
      setCreateDraft(emptyCreateDraft());
      setMessage("商品已创建");
      await loadItems();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "创建商品失败");
    }
  };

  const handleStartEdit = (item: ShopItem) => {
    setEditingItemId(item.id);
    setEditDraft(toUpdateDraft(item));
    setMessage("");
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditDraft(null);
  };

  const handleSaveEdit = async () => {
    if (!editingItemId || !editDraft) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await updateShopItem(userId, editingItemId, editDraft);
      setEditingItemId(null);
      setEditDraft(null);
      setMessage(`商品 ${editingItemId} 已更新`);
      await loadItems();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "更新商品失败");
    }
  };

  const handleDeactivate = async (itemId: string) => {
    setError("");
    setMessage("");

    try {
      await deactivateShopItem(userId, itemId);
      if (editingItemId === itemId) {
        handleCancelEdit();
      }
      setMessage(`商品 ${itemId} 已下架`);
      await loadItems();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "下架商品失败");
    }
  };

  return {
    items,
    createDraft,
    editingItemId,
    editDraft,
    loading,
    message,
    error,
    setCreateDraft,
    setEditDraft,
    loadItems,
    handleCreate,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleDeactivate,
  };
};
