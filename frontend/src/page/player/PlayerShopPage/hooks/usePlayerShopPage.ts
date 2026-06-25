import { useCallback, useEffect, useState } from "react";
import { getPlayerUiData } from "../../../../api/player/ui/GetPlayerUiDataApi.js";
import { invokePlayerUiAction } from "../../../../api/player/ui/InvokePlayerUiActionApi.js";
import type { PlayerWallet, ShopItem } from "../objects/player-shop-page-types.js";

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

export const usePlayerShopPage = (userId: string) => {
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

  return {
    wallet,
    shopItems,
    loading,
    message,
    error,
    handleRefreshShop,
    handleBuyItem,
  };
};
