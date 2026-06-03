import { useState } from "react";

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

const createShopInventory = (seed: number): ShopItem[] => {
  const catalogs: ShopItem[][] = [
    [
      {
        id: `scope-${seed}`,
        name: "精准瞄准镜",
        description: "下一次发射获得更稳定的落点辅助。",
        price: 120,
        currency: "coins",
      },
      {
        id: `coupon-${seed}`,
        name: "双倍奖励券",
        description: "本日通关金币奖励翻倍一次。",
        price: 8,
        currency: "gems",
      },
      {
        id: `steel-${seed}`,
        name: "钢羽皮肤",
        description: "为基础鸟解锁金属风格外观。",
        price: 260,
        currency: "coins",
      },
      {
        id: `starter-${seed}`,
        name: "新手补给包",
        description: "包含金币、钻石和一次关卡复活机会。",
        price: 18,
        currency: "gems",
      },
    ],
    [
      {
        id: `booster-${seed}`,
        name: "爆裂推进器",
        description: "短时间提升冲击力，适合拆高塔关卡。",
        price: 420,
        currency: "coins",
      },
      {
        id: `feather-${seed}`,
        name: "流光羽饰",
        description: "稀有外观部件，提升测试服收藏感。",
        price: 24,
        currency: "gems",
      },
      {
        id: `crate-${seed}`,
        name: "工程物资箱",
        description: "解锁更多练习素材和试验配置。",
        price: 360,
        currency: "coins",
      },
      {
        id: `vip-${seed}`,
        name: "测试员礼包",
        description: "内含钻石、金币和限定称号。",
        price: 32,
        currency: "gems",
      },
    ],
  ];

  return catalogs[seed % catalogs.length] ?? catalogs[0] ?? [];
};

export const PlayerShopPage = () => {
  const [wallet, setWallet] = useState<PlayerWallet>({ coins: 1280, gems: 96 });
  const [shopSeed, setShopSeed] = useState(0);
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => createShopInventory(0));
  const [message, setMessage] = useState("");

  const handleRefreshShop = () => {
    setShopSeed((current) => {
      const nextSeed = current + 1;
      setShopItems(createShopInventory(nextSeed));
      return nextSeed;
    });
    setMessage("商店货架已刷新");
  };

  const handleBuyItem = (item: ShopItem) => {
    if (item.currency === "coins") {
      if (wallet.coins < item.price) {
        setMessage(`${item.name} 购买失败，金币不足`);
        return;
      }

      setWallet((current) => ({ ...current, coins: current.coins - item.price }));
      setMessage(`已购买 ${item.name}`);
      return;
    }

    if (wallet.gems < item.price) {
      setMessage(`${item.name} 购买失败，钻石不足`);
      return;
    }

    setWallet((current) => ({ ...current, gems: current.gems - item.price }));
    setMessage(`已购买 ${item.name}`);
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
          <p className="panel-copy">使用金币和钻石购买道具、皮肤与增益包，测试期支持快速刷新货架。</p>
        </div>
        <div className="shop-header-actions">
          <button type="button" className="secondary" onClick={handleRefreshShop}>
            刷新
          </button>
        </div>
      </div>

      {message ? <p className="feedback success">{message}</p> : null}

      <div className="shop-grid shop-page-grid">
        {shopItems.map((item) => (
          <article key={item.id} className="shop-item-card">
            <strong>{item.name}</strong>
            <p>{item.description}</p>
            <span>
              {item.price} {item.currency === "coins" ? "金币" : "钻石"}
            </span>
            <button type="button" onClick={() => handleBuyItem(item)}>
              购买
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
