import type {
  CreateShopItemRequestBody,
  UpdateShopItemRequestBody,
} from "../../../objects/api/api-contracts.js";
import { AdminShopHeader } from "./components/AdminShopHeader.js";
import { useAdminShopPage } from "./hooks/useAdminShopPage.js";
import type { AdminShopPageProps } from "./objects/admin-shop-page-types.js";

export const AdminShopPage = ({ userId }: AdminShopPageProps) => {
  const vm = useAdminShopPage(userId);

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
      <AdminShopHeader itemCount={vm.items.length} />

      <button type="button" className="secondary" onClick={() => void vm.loadItems()} disabled={vm.loading}>
        {vm.loading ? "刷新中..." : "刷新商品列表"}
      </button>

      {vm.message ? <p className="feedback success">{vm.message}</p> : null}
      {vm.error ? <p className="feedback error">{vm.error}</p> : null}

      <div className="feature-grid admin-community-grid">
        <section className="feature-card">
          <h3>新建商品</h3>
          {renderItemFields(vm.createDraft, (next) => vm.setCreateDraft(next as CreateShopItemRequestBody))}
          <div className="actions">
            <button type="button" onClick={() => void vm.handleCreate()} disabled={vm.loading}>
              创建商品
            </button>
          </div>
        </section>

        <section className="feature-card">
          <h3>商品列表</h3>
          <div className="feature-stack">
            {vm.items.length === 0 && !vm.loading ? <p>当前没有商店商品。</p> : null}
            {vm.items.map((item) => (
              <article key={item.id} className="mini-card">
                {vm.editingItemId === item.id && vm.editDraft ? (
                  <>
                    <div className="mini-card-header">
                      <strong>编辑 {item.id}</strong>
                      <span>{item.active ? "上架" : "已下架"}</span>
                    </div>
                    {renderItemFields(vm.editDraft, (next) => vm.setEditDraft(next as UpdateShopItemRequestBody))}
                    <div className="actions">
                      <button type="button" onClick={() => void vm.handleSaveEdit()} disabled={vm.loading}>
                        保存
                      </button>
                      <button type="button" className="secondary" onClick={vm.handleCancelEdit}>
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
                      <button type="button" onClick={() => vm.handleStartEdit(item)} disabled={vm.loading}>
                        编辑
                      </button>
                      {item.active ? (
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => void vm.handleDeactivate(item.id)}
                          disabled={vm.loading}
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
