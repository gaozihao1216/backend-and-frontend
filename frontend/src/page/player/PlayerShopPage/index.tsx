import { PlayerShopHeader } from "./components/PlayerShopHeader.js";
import { usePlayerShopPage } from "./hooks/usePlayerShopPage.js";
import type { PlayerShopPageProps } from "./objects/player-shop-page-types.js";

export const PlayerShopPage = ({ userId }: PlayerShopPageProps) => {
  const vm = usePlayerShopPage(userId);

  return (
    <section className="panel">
      <PlayerShopHeader wallet={vm.wallet} onRefreshShop={vm.handleRefreshShop} loading={vm.loading} />

      {vm.message ? <p className="feedback success">{vm.message}</p> : null}
      {vm.error ? <p className="feedback error">{vm.error}</p> : null}
      {vm.loading ? <p className="meta">正在加载商店数据...</p> : null}

      <div className="shop-grid shop-page-grid">
        {vm.shopItems.map((item) => (
          <article key={item.id} className="shop-item-card">
            <strong>{item.name}</strong>
            <p>{item.description}</p>
            <span>
              {item.price} {item.currency === "coins" ? "金币" : "钻石"}
            </span>
            <button type="button" onClick={() => void vm.handleBuyItem(item)} disabled={vm.loading}>
              购买
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
