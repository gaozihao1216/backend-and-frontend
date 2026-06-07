import { useCallback, useEffect, useState } from "react";
import { getPlayerUiData, invokePlayerUiAction } from "../api/player-ui-api.js";

type CurrencyType = "coins" | "gems";

type PlayerWallet = {
  coins: number;
  gems: number;
};

type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyType;
};

type PlayerShopPageProps = {
  userId: string;
};

const readWallet = (payload: Record<string, unknown>): PlayerWallet => {
  const wallet = payload.wallet;
  if (!wallet || typeof wallet !== "object") {
    return { coins: 0, gems: 0 };
  }

  const record = wallet as Record<string, unknown>;
  return {
    coins: typeof record.coins === "number" ? record.coins : 0,
    gems: typeof record.gems === "number" ? record.gems : 0,
  };
};

const readShopItems = (payload: Record<string, unknown>): ShopItem[] => {
  if (!Array.isArray(payload.items)) {
    return [];
  }

  return payload.items.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== "string"
      || typeof record.name !== "string"
      || typeof record.description !== "string"
      || typeof record.price !== "number"
      || (record.currency !== "coins" && record.currency !== "gems")
    ) {
      return [];
    }

    return [{
      id: record.id,
      name: record.name,
      description: record.description,
      price: record.price,
      currency: record.currency,
    }];
  });
};

export const PlayerShopPage = ({ userId }: PlayerShopPageProps) => {
  const [catalogIndex, setCatalogIndex] = useState(0);
  const [wallet, setWallet] = useState<PlayerWallet>({ coins: 0, gems: 0 });
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadShop = useCallback(async (nextCatalogIndex: number) => {
    setLoading(true);
    setError("");

    try {
      const payload = await getPlayerUiData(userId, "player.shop", {
        catalogIndex: String(nextCatalogIndex),
      });
      setWallet(readWallet(payload));
      setShopItems(readShopItems(payload));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载商店失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadShop(catalogIndex);
  }, [catalogIndex, loadShop]);

  const handleRefreshShop = () => {
    setCatalogIndex((current) => (current + 1) % 2);
    setMessage("商店货架已刷新");
  };

  const handleBuyItem = async (item: ShopItem) => {
    setError("");
    setMessage("");

    try {
      const payload = await invokePlayerUiAction(userId, "player.shop.purchase", {
        itemId: item.id,
        catalogIndex: String(catalogIndex),
      });
      setWallet(readWallet(payload));
      setShopItems(readShopItems(payload));
      setMessage(`已购买 ${item.name}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `${item.name} 购买失败`);
    }
  };

  return (
    <section className="panel">
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
          <button type="button" className="secondary" onClick={handleRefreshShop} disabled={loading}>
            刷新
          </button>
        </div>
      </div>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}
      {loading ? <p className="meta">正在加载商店数据...</p> : null}

      <div className="shop-grid shop-page-grid">
        {shopItems.map((item) => (
          <article key={item.id} className="shop-item-card">
            <strong>{item.name}</strong>
            <p>{item.description}</p>
            <span>
              {item.price} {item.currency === "coins" ? "金币" : "钻石"}
            </span>
            <button type="button" onClick={() => void handleBuyItem(item)} disabled={loading}>
              购买
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
