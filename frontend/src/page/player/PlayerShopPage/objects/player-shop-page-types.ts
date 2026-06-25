export type CurrencyType = "coins" | "gems";

export type PlayerWallet = {
  coins: number;
  gems: number;
};

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyType;
};

export type PlayerShopPageProps = {
  userId: string;
};
