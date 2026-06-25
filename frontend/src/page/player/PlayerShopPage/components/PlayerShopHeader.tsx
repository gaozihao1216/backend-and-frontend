import type { PlayerWallet } from "../objects/player-shop-page-types.js";

type PlayerShopHeaderProps = {
  wallet: PlayerWallet;
  onRefreshShop: () => void;
  loading: boolean;
};

export const PlayerShopHeader = ({ wallet, onRefreshShop, loading }: PlayerShopHeaderProps) => (
  <div className="shop-overlay-header">
    <div className="shop-title-group">
      <p className="eyebrow">Player Shop</p>
      <div className="shop-title-row">
        <h2>玩家商店</h2>
        <div className="shop-balance-bar shop-balance-inline">
          <article className="shop-balance-chip">
            <strong>{wallet.coins}</strong>
            <span>金币</span>
          </article>
          <article className="shop-balance-chip">
            <strong>{wallet.gems}</strong>
            <span>钻石</span>
          </article>
        </div>
      </div>
      <p className="panel-copy">使用金币和钻石购买道具、皮肤与增益包。余额与购买记录已同步到后端。</p>
    </div>
    <div className="shop-header-actions">
      <button type="button" className="secondary" onClick={onRefreshShop} disabled={loading}>
        刷新
      </button>
    </div>
  </div>
);
