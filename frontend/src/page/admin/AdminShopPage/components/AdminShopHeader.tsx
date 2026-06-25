type AdminShopHeaderProps = {
  itemCount: number;
};

export const AdminShopHeader = ({ itemCount }: AdminShopHeaderProps) => (
  <div className="feature-header">
    <div>
      <h2>商店管理</h2>
      <p className="panel-copy">维护玩家商店商品目录；删除操作会下架商品而非物理删除。</p>
    </div>
    <div className="feature-pill">商品 {itemCount}</div>
  </div>
);
