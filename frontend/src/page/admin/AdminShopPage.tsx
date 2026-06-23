import { useEffect, useState } from "react";
import type {
  CreateShopItemRequestBody,
  ShopItem,
  UpdateShopItemRequestBody,
} from "../../api/api-contracts.js";
import {
  createShopItem,
  deactivateShopItem,
  listAdminShopItems,
  updateShopItem,
} from "../../api/index.js";

type AdminShopPageProps = {
  userId: string;
};

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

export const AdminShopPage = ({ userId }: AdminShopPageProps) => {
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

  const renderItemFields = (
    draft: CreateShopItemRequestBody | UpdateShopItemRequestBody,
    onChange: (next: CreateShopItemRequestBody | UpdateShopItemRequestBody) => void,
  ) => (
    <div className="feature-stack admin-shop-form">
      <label>
        名称
        <input
          type="text"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />
      </label>
      <label>
        描述
        <textarea
          value={draft.description}
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          rows={2}
        />
      </label>
      <label>
        价格
        <input
          type="number"
          min={1}
          value={draft.price}
          onChange={(event) => onChange({ ...draft, price: Number(event.target.value) || 1 })}
        />
      </label>
      <label>
        货币
        <select
          value={draft.currency}
          onChange={(event) => onChange({
            ...draft,
            currency: event.target.value === "gems" ? "gems" : "coins",
          })}
        >
          <option value="coins">金币</option>
          <option value="gems">钻石</option>
        </select>
      </label>
      <label>
        货架索引
        <input
          type="number"
          min={0}
          value={draft.catalogIndex}
          onChange={(event) => onChange({ ...draft, catalogIndex: Number(event.target.value) || 0 })}
        />
      </label>
      <label>
        排序
        <input
          type="number"
          value={draft.sortOrder}
          onChange={(event) => onChange({ ...draft, sortOrder: Number(event.target.value) || 0 })}
        />
      </label>
      <label className="admin-shop-checkbox">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(event) => onChange({ ...draft, active: event.target.checked })}
        />
        上架中
      </label>
    </div>
  );

  return (
    <section className="panel">
      <div className="feature-header">
        <div>
          <h2>商店管理</h2>
          <p className="panel-copy">维护玩家商店商品目录；删除操作会下架商品而非物理删除。</p>
        </div>
        <div className="feature-pill">商品 {items.length}</div>
      </div>

      <button type="button" className="secondary" onClick={() => void loadItems()} disabled={loading}>
        {loading ? "刷新中..." : "刷新商品列表"}
      </button>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <div className="feature-grid admin-community-grid">
        <section className="feature-card">
          <h3>新建商品</h3>
          {renderItemFields(createDraft, (next) => setCreateDraft(next as CreateShopItemRequestBody))}
          <div className="actions">
            <button type="button" onClick={() => void handleCreate()} disabled={loading}>
              创建商品
            </button>
          </div>
        </section>

        <section className="feature-card">
          <h3>商品列表</h3>
          <div className="feature-stack">
            {items.length === 0 && !loading ? <p>当前没有商店商品。</p> : null}
            {items.map((item) => (
              <article key={item.id} className="mini-card">
                {editingItemId === item.id && editDraft ? (
                  <>
                    <div className="mini-card-header">
                      <strong>编辑 {item.id}</strong>
                      <span>{item.active ? "上架" : "已下架"}</span>
                    </div>
                    {renderItemFields(editDraft, (next) => setEditDraft(next as UpdateShopItemRequestBody))}
                    <div className="actions">
                      <button type="button" onClick={() => void handleSaveEdit()} disabled={loading}>
                        保存
                      </button>
                      <button type="button" className="secondary" onClick={handleCancelEdit}>
                        取消
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mini-card-header">
                      <strong>{item.name}</strong>
                      <span>{item.active ? "上架" : "已下架"}</span>
                    </div>
                    <p>{item.description}</p>
                    <p className="meta">
                      ID: {item.id} · {item.price} {item.currency === "coins" ? "金币" : "钻石"}
                      · 货架 {item.catalogIndex} · 排序 {item.sortOrder}
                    </p>
                    <div className="actions">
                      <button type="button" onClick={() => handleStartEdit(item)} disabled={loading}>
                        编辑
                      </button>
                      {item.active ? (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => void handleDeactivate(item.id)}
                          disabled={loading}
                        >
                          下架
                        </button>
                      ) : null}
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
