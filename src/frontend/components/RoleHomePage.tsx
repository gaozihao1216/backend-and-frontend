import { useEffect, useRef, useState } from "react";
import { type AuthRole, type AuthUser } from "../lib/auth.js";
import { BackendBindingPanel } from "./BackendBindingPanel.js";
import { AdminCommunityPage } from "../pages/AdminCommunityPage.js";
import { AdminPage } from "../pages/AdminPage.js";
import { DesignerBirdLabPage } from "../pages/DesignerBirdLabPage.js";
import { DesignerPage } from "../pages/DesignerPage.js";
import { PlayerPage } from "../pages/PlayerPage.js";
import { PlayerCommunityPage } from "../pages/PlayerCommunityPage.js";
import { UserProfilePage } from "../pages/UserProfilePage.js";

type RoleHomePageProps = {
  user: AuthUser;
  onOpenSettings: () => void;
  onUserUpdated: (user: AuthUser) => void;
};

type DetailView =
  | "user-profile"
  | "player-levels"
  | "player-community"
  | "player-shop"
  | "designer-map"
  | "designer-birds"
  | "admin-community"
  | "admin-proposal"
  | null;

type LevelStatus = "unlocked" | "current" | "locked";

type CurrencyType = "coins" | "gems";

type PlayerWallet = {
  coins: number;
  gems: number;
  checkedIn: boolean;
};

type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: CurrencyType;
};

const roleLabels: Record<AuthRole, string> = {
  player: "玩家",
  designer: "设计师",
  admin: "管理员",
};

const chainLevels = [
  {
    id: "01",
    status: "unlocked" as LevelStatus,
    title: "草地训练场",
    x: 12,
    y: 28,
    story: "新手训练场刚刚开放，玩家需要用最基础的鸟摸清抛物线与木箱受力。",
  },
  {
    id: "02",
    status: "current" as LevelStatus,
    title: "风桥回旋点",
    x: 24,
    y: 40,
    story: "风桥上的猪群开始搭建第二层防线，回旋角度和时机决定能否快速破局。",
  },
  {
    id: "03",
    status: "locked" as LevelStatus,
    title: "高塔猪舍",
    x: 36,
    y: 28,
    story: "穿过风桥后才能进入高塔猪舍，这里隐藏着更复杂的纵向结构机关。",
  },
  {
    id: "04",
    status: "locked" as LevelStatus,
    title: "玻璃深谷",
    x: 48,
    y: 40,
    story: "深谷中的玻璃墙会连续反射冲击波，需要提前规划多段连锁坍塌。",
  },
  {
    id: "05",
    status: "locked" as LevelStatus,
    title: "双城核心",
    x: 60,
    y: 28,
    story: "这是当前章节的终局关卡，双城核心需要同时摧毁左右两组能源塔。",
  },
  {
    id: "06",
    status: "locked" as LevelStatus,
    title: "暮色仓场",
    x: 72,
    y: 40,
    story: "夕阳下的仓场堆满易燃木箱，需要快速拆掉关键承重点。",
  },
  {
    id: "07",
    status: "locked" as LevelStatus,
    title: "碎岩坡道",
    x: 84,
    y: 28,
    story: "坡道上的滚石会改变撞击路径，稍有偏差就会错失连锁机会。",
  },
  {
    id: "08",
    status: "locked" as LevelStatus,
    title: "寒雾驿站",
    x: 96,
    y: 40,
    story: "寒雾会遮挡部分视野，玩家需要依靠结构判断完成盲打。",
  },
  {
    id: "09",
    status: "locked" as LevelStatus,
    title: "熔炉回廊",
    x: 108,
    y: 28,
    story: "高温熔炉会持续震动支架，拖延越久越容易引发意外坍塌。",
  },
  {
    id: "10",
    status: "locked" as LevelStatus,
    title: "终章观测塔",
    x: 120,
    y: 40,
    story: "观测塔是测试章节的最终挑战，要求同时完成精确打点与资源分配。",
  },
] as const;

const CHECK_IN_REWARD = {
  coins: 10_000_000,
  gems: 10_000_000,
} as const;

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

const createChainLinks = () =>
  chainLevels.slice(0, -1).flatMap((level, index) => {
    const nextLevel = chainLevels[index + 1];
    if (!nextLevel) {
      return [];
    }

    const deltaX = nextLevel.x - level.x;
    const deltaY = nextLevel.y - level.y;
    const distance = Math.hypot(deltaX, deltaY);
    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    const linkCount = Math.max(4, Math.floor(distance / 7.5));

    return Array.from({ length: linkCount }, (_, linkIndex) => {
      const progress = (linkIndex + 0.5) / linkCount;
      const x = level.x + deltaX * progress;
      const y = level.y + deltaY * progress;
      const rotation = angle + (linkIndex % 2 === 0 ? 7 : -7);

      return (
        <g
          key={`${level.id}-${nextLevel.id}-${linkIndex}`}
          transform={`rotate(${rotation} ${x} ${y})`}
        >
          <rect
            className="adventure-path-plank"
            x={x - 2.45}
            y={y - 0.78}
            rx={0.55}
            ry={0.55}
            width={4.9}
            height={1.56}
          />
          <line className="adventure-path-rope" x1={x - 2.05} y1={y - 0.64} x2={x + 2.05} y2={y - 0.64} />
          <line className="adventure-path-rope" x1={x - 2.05} y1={y + 0.64} x2={x + 2.05} y2={y + 0.64} />
        </g>
      );
    });
  });

const getStatusButtonLabel = (role: AuthRole) => {
  switch (role) {
    case "player":
      return "财富";
    case "designer":
      return "身份";
    case "admin":
      return "身份";
  }
};

const getStatusTitle = (user: AuthUser) => {
  if (user.role === "player") {
    return "财富与进度";
  }

  return "账号身份";
};

const getStatusContent = (user: AuthUser, wallet: PlayerWallet) => {
  if (user.role === "player") {
    return (
      <div className="floating-stats">
        <article className="stat-chip">
          <strong>{wallet.coins}</strong>
          <span>当前金币</span>
        </article>
        <article className="stat-chip">
          <strong>{wallet.gems}</strong>
          <span>当前钻石</span>
        </article>
        <article className="stat-chip">
          <strong>02 / 05</strong>
          <span>关卡进度</span>
        </article>
      </div>
    );
  }

  return (
    <div className="floating-stats">
      <article className="stat-chip">
        <strong>{roleLabels[user.role]}</strong>
        <span>当前身份</span>
      </article>
      <article className="stat-chip">
        <strong>{user.id}</strong>
        <span>10 位用户 ID</span>
      </article>
    </div>
  );
};

const getActionButtonLabel = (role: AuthRole) => {
  switch (role) {
    case "player":
      return "社区";
    case "designer":
      return "创作";
    case "admin":
      return "管理";
  }
};

const getActionOptions = (role: AuthRole) => {
  switch (role) {
    case "player":
      return [
        { id: "user-profile" as const, label: "个人主页" },
        { id: "player-levels" as const, label: "关卡大厅" },
        { id: "player-community" as const, label: "社区大厅" },
        { id: "player-shop" as const, label: "商店" },
      ];
    case "designer":
      return [
        { id: "user-profile" as const, label: "个人主页" },
        { id: "designer-map" as const, label: "创造地图" },
        { id: "designer-birds" as const, label: "鸟类开发" },
      ];
    case "admin":
      return [
        { id: "user-profile" as const, label: "个人主页" },
        { id: "admin-community" as const, label: "社区管理" },
        { id: "admin-proposal" as const, label: "提案处理" },
      ];
  }
};

const getDetailTitle = (detailView: Exclude<DetailView, null>) => {
  switch (detailView) {
    case "user-profile":
      return "个人主页";
    case "player-community":
      return "社区大厅";
    case "player-levels":
      return "关卡大厅";
    case "player-shop":
      return "商店";
    case "designer-map":
      return "创造地图";
    case "designer-birds":
      return "鸟类开发";
    case "admin-community":
      return "社区管理";
    case "admin-proposal":
      return "提案处理";
  }
};

const renderDetailContent = (
  user: AuthUser,
  detailView: Exclude<DetailView, null>,
  onUserUpdated: (user: AuthUser) => void,
) => {
  const hasBoundApiUser = Boolean(user.apiUserId);

  switch (detailView) {
    case "user-profile":
      return hasBoundApiUser && user.apiUserId ? (
        <UserProfilePage viewerUserId={user.apiUserId} profileUserId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="个人主页" user={user} onBound={onUserUpdated} />
      );
    case "player-community":
      return hasBoundApiUser && user.apiUserId ? (
        <PlayerCommunityPage nickname={user.nickname} userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="社区大厅" user={user} onBound={onUserUpdated} />
      );
    case "player-levels":
      return hasBoundApiUser && user.apiUserId ? (
        <PlayerPage userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="关卡大厅" user={user} onBound={onUserUpdated} />
      );
    case "player-shop":
      return (
        <section className="panel">
          <h2>商店</h2>
          <p className="panel-copy">这里预留给金币消费、道具购买和限时礼包的玩家商店入口。</p>
        </section>
      );
    case "designer-map":
      return hasBoundApiUser && user.apiUserId ? (
        <DesignerPage userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="创造地图" user={user} onBound={onUserUpdated} />
      );
    case "designer-birds":
      return <DesignerBirdLabPage nickname={user.nickname} />;
    case "admin-community":
      return hasBoundApiUser && user.apiUserId ? (
        <AdminCommunityPage nickname={user.nickname} userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="社区管理" user={user} onBound={onUserUpdated} />
      );
    case "admin-proposal":
      return hasBoundApiUser && user.apiUserId ? (
        <AdminPage userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="提案处理" user={user} onBound={onUserUpdated} />
      );
  }
};

export const RoleHomePage = ({ user, onOpenSettings, onUserUpdated }: RoleHomePageProps) => {
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
  });
  const [statusOpen, setStatusOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const [detailView, setDetailView] = useState<DetailView>(null);
  const [wallet, setWallet] = useState<PlayerWallet>({
    coins: 1280,
    gems: 96,
    checkedIn: false,
  });
  const [shopSeed, setShopSeed] = useState(0);
  const [shopItems, setShopItems] = useState<ShopItem[]>(() => createShopInventory(0));
  const [shopMessage, setShopMessage] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const isShopOverlayOpen = detailView === "player-shop";
  const selectedLevel = chainLevels.find((level) => level.id === selectedLevelId) ?? null;

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 3);
  }, []);

  const openDetail = (nextView: Exclude<DetailView, null>) => {
    setDetailView(nextView);
    setActionOpen(false);
  };

  const handleCheckIn = () => {
    if (user.role !== "player") {
      return;
    }

    if (wallet.checkedIn) {
      setShopMessage("本轮测试登录已完成签到");
      return;
    }

    setWallet((current) => ({
      coins: current.coins + CHECK_IN_REWARD.coins,
      gems: current.gems + CHECK_IN_REWARD.gems,
      checkedIn: true,
    }));
    setShopMessage("签到成功，已发放测试期金币和钻石奖励");
    setStatusOpen(true);
  };

  const handleRefreshShop = () => {
    setShopSeed((current) => {
      const nextSeed = current + 1;
      setShopItems(createShopInventory(nextSeed));
      return nextSeed;
    });
    setShopMessage("商店货架已刷新");
  };

  const handleBuyItem = (item: ShopItem) => {
    if (item.currency === "coins") {
      if (wallet.coins < item.price) {
        setShopMessage(`${item.name} 购买失败，金币不足`);
        return;
      }

      setWallet((current) => ({
        ...current,
        coins: current.coins - item.price,
      }));
      setShopMessage(`已购买 ${item.name}`);
      return;
    }

    if (wallet.gems < item.price) {
      setShopMessage(`${item.name} 购买失败，钻石不足`);
      return;
    }

    setWallet((current) => ({
      ...current,
      gems: current.gems - item.price,
    }));
    setShopMessage(`已购买 ${item.name}`);
  };

  const openLevelOverlay = (levelId: string) => {
    setSelectedLevelId(levelId);
    setActionOpen(false);
    setStatusOpen(false);
  };

  const handleMapMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest(".chain-planet")) {
      return;
    }

    const viewport = mapViewportRef.current;
    if (!viewport) {
      return;
    }

    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: viewport.scrollLeft,
      startScrollTop: viewport.scrollTop,
    };
  };

  const handleMapMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const viewport = mapViewportRef.current;
    if (!viewport || !dragStateRef.current.active) {
      return;
    }

    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;

    viewport.scrollLeft = dragStateRef.current.startScrollLeft - deltaX;
    viewport.scrollTop = dragStateRef.current.startScrollTop - deltaY;
  };

  const stopMapDragging = () => {
    dragStateRef.current.active = false;
  };

  return (
    <section className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <p className="eyebrow">Role Home</p>
          <h1>{roleLabels[user.role]}主界面</h1>
          <p className="hero-copy">欢迎，{user.nickname}。链条式关卡是主舞台，功能以角落按钮展开。</p>
        </div>
        <button type="button" className="secondary" onClick={onOpenSettings}>
          设置
        </button>
      </div>

      <section className="chain-stage">
        <div className="stage-header">
          <p className="eyebrow">Level Chain</p>
          <span className="chain-meta">当前用户 ID：{user.id}</span>
        </div>

        <div
          className={`chain-stage-body ${isShopOverlayOpen ? "shop-overlay-open" : ""} ${selectedLevel ? "level-overlay-open" : ""}`}
        >
          <div className="corner-anchor top-left">
            <div className="top-left-actions">
              {user.role === "player" ? (
                <>
                  <button
                    type="button"
                    className="corner-button"
                    onClick={() => openDetail("player-shop")}
                  >
                    商店
                  </button>
                  <button type="button" className="corner-button secondary" onClick={handleCheckIn}>
                    签到
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="corner-button"
                onClick={() => setStatusOpen((current) => !current)}
              >
                {getStatusButtonLabel(user.role)}
              </button>
            </div>
            {statusOpen ? (
              <div className="floating-panel floating-panel-left">
                <div className="floating-panel-header">
                  <strong>{getStatusTitle(user)}</strong>
                  <button
                    type="button"
                    className="floating-close"
                    onClick={() => setStatusOpen(false)}
                  >
                    收起
                  </button>
                </div>
                {getStatusContent(user, wallet)}
              </div>
            ) : null}
          </div>

          <div className="corner-anchor top-right">
            <button type="button" className="corner-button secondary" onClick={onOpenSettings}>
              设置
            </button>
          </div>

          <div
            ref={mapViewportRef}
            className="chain-map-viewport"
            onMouseDown={handleMapMouseDown}
            onMouseMove={handleMapMouseMove}
            onMouseUp={stopMapDragging}
            onMouseLeave={stopMapDragging}
          >
            <div className="chain-map-canvas">
              <div className="sky-cloud cloud-one" aria-hidden="true" />
              <div className="sky-cloud cloud-two" aria-hidden="true" />
              <div className="sky-cloud cloud-three" aria-hidden="true" />
              <div className="floating-island island-one" aria-hidden="true" />
              <div className="floating-island island-two" aria-hidden="true" />
              <div className="floating-island island-three" aria-hidden="true" />
              <svg
                className="chain-lines"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {createChainLinks()}
              </svg>

              {chainLevels.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  className={`chain-planet ${level.status} ${user.role === "player" && level.status === "locked" ? "player-locked" : ""}`}
                  style={{
                    left: `${level.x}%`,
                    top: `${level.y}%`,
                  }}
                  onClick={() => openLevelOverlay(level.id)}
                >
                  {user.role === "player" && level.status === "locked" ? (
                    <>
                      <div className="planet-lock-shackle" aria-hidden="true" />
                      <div className="planet-lock-body" aria-hidden="true">
                        <span className="planet-lock-slot" />
                      </div>
                      <div className="planet-lock-haze" aria-hidden="true" />
                      <p className="planet-lock-copy">未解锁</p>
                    </>
                  ) : null}
                  <span className="chain-planet-id">{level.id}</span>
                  <span className="chain-planet-title">{level.title}</span>
                </button>
              ))}
            </div>
          </div>

          {isShopOverlayOpen ? (
            <div className="shop-overlay-backdrop" role="presentation">
              <section className="shop-overlay-panel" aria-label="商店">
                <div className="shop-overlay-header">
                  <div className="shop-title-group">
                    <p className="eyebrow">Player Shop</p>
                    <div className="shop-title-row">
                      <h2>商店</h2>
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
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setDetailView(null)}
                    >
                      关闭商店
                    </button>
                  </div>
                </div>

                {shopMessage ? <p className="feedback success">{shopMessage}</p> : null}

                <div className="shop-grid">
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
            </div>
          ) : null}

          {selectedLevel ? (
            <div className="level-overlay-backdrop" role="presentation">
              <section className="level-overlay-panel" aria-label={`关卡 ${selectedLevel.title}`}>
                <div className="level-overlay-header">
                  <div>
                    <p className="eyebrow">Level Brief</p>
                    <h2>
                      {selectedLevel.id} {selectedLevel.title}
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setSelectedLevelId(null)}
                  >
                    关闭介绍
                  </button>
                </div>

                <div className="level-overlay-content">
                  <section className="level-preview-card">
                    <div className="level-preview-sheet">
                      <span>白纸简略图</span>
                    </div>
                  </section>

                  <section className="level-story-card">
                    <h3>剧情简介</h3>
                    <p>{selectedLevel.story}</p>
                    <p className="meta">
                      当前状态：
                      {selectedLevel.status === "current"
                        ? " 可挑战"
                        : selectedLevel.status === "unlocked"
                          ? " 已解锁"
                          : " 未解锁"}
                    </p>
                    <button
                      type="button"
                      disabled={selectedLevel.status === "locked"}
                      onClick={() =>
                        setShopMessage(
                          selectedLevel.status === "locked"
                            ? "该关卡尚未解锁"
                            : `准备进入 ${selectedLevel.title}`,
                        )
                      }
                    >
                      开始游戏
                    </button>
                  </section>
                </div>
              </section>
            </div>
          ) : null}

          <div className="corner-anchor bottom-right">
            <button
              type="button"
              className="corner-button"
              onClick={() => setActionOpen((current) => !current)}
            >
              {getActionButtonLabel(user.role)}
            </button>
            {actionOpen ? (
              <div className="floating-panel floating-panel-right">
                <div className="floating-panel-header">
                  <strong>功能入口</strong>
                  <button
                    type="button"
                    className="floating-close"
                    onClick={() => setActionOpen(false)}
                  >
                    收起
                  </button>
                </div>
                <div className="floating-action-list">
                  {getActionOptions(user.role).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="floating-action-button"
                      onClick={() => openDetail(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {detailView && detailView !== "player-shop" ? (
        <section className={`detail-shell ${detailView === "player-community" ? "community-detail-shell" : ""}`}>
          <div className="detail-shell-header">
            <div>
              <p className="eyebrow">Expanded Panel</p>
              <h2>{getDetailTitle(detailView)}</h2>
            </div>
            <button
              type="button"
              className="secondary detail-close-button"
              onClick={() => setDetailView(null)}
            >
              关闭面板
            </button>
          </div>
          {renderDetailContent(user, detailView, onUserUpdated)}
        </section>
      ) : null}
    </section>
  );
};
