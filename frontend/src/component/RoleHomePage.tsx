import { useEffect, useRef, useState } from "react";
import { getPlayerUiData, invokePlayerUiAction } from "../api/player-ui-api.js";
import { type AuthRole, type AuthUser, getBoundApiUserId } from "../lib/auth.js";
import { BackendBindingPanel } from "./BackendBindingPanel.js";
import { LevelPreviewCard } from "./level/LevelPreviewCard.js";
import { AdminPage } from "../page/AdminPage.js";
import { DesignerPage } from "../page/DesignerPage/index.js";
import { PlayerPage } from "../page/PlayerPage.js";
import { getStarterLevelSource } from "../lib/level-repository.js";

type RoleHomePageProps = {
  user: AuthUser;
  onOpenSettings: () => void;
  onUserUpdated: (user: AuthUser) => void;
  onOpenDesignerDesign?: () => void;
  onOpenDesignerPortfolio?: () => void;
  onNavigate: (path: string) => void;
};

type DetailView =
  | "user-profile"
  | "player-levels"
  | "player-community"
  | "player-shop"
  | "player-social"
  | "player-preparation"
  | "designer-map"
  | "designer-portfolio"
  | "designer-birds"
  | "admin-community"
  | "admin-proposal"
  | "admin-director"
  | null;

type LevelStatus = "unlocked" | "current" | "locked";

type PlayerWallet = {
  coins: number;
  gems: number;
  checkedIn: boolean;
};

const roleLabels: Record<AuthRole, string> = {
  player: "玩家",
  designer: "设计师",
  admin: "管理员",
};

const adminLevelLabels = {
  standard: "普通管理员",
  director: "总监管理员",
} as const;

const getAdminLevelLabel = (user: AuthUser) =>
  user.role === "admin" && user.adminLevel ? adminLevelLabels[user.adminLevel] : null;

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

const ROLE_HOME_CHECK_IN_PANEL_ID = "player.home.checkIn";

const OWN_PAGE_PATH = "/own_page";
const COMMUNITY_HALL_PATH = "/community_hall";
const PLAYER_SHOP_PATH = "/player_shop";
const PLAYER_SOCIAL_PATH = "/player_social";
const PLAYER_PREPARATION_PATH = "/player_preparation";
const DIRECTOR_CONSOLE_PATH = "/director_console";
const ADMIN_PROPOSALS_PATH = "/admin/proposals";
const DESIGNER_BIRDS_PATH = "/designer/birds";

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
      {getAdminLevelLabel(user) ? (
        <article className="stat-chip">
          <strong>{getAdminLevelLabel(user)}</strong>
          <span>管理员权限</span>
        </article>
      ) : null}
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

const getActionOptions = (user: AuthUser) => {
  switch (user.role) {
    case "player":
      return [
        { id: "user-profile" as const, label: "个人主页" },
        { id: "player-levels" as const, label: "关卡大厅" },
        { id: "player-community" as const, label: "社区大厅" },
        { id: "player-social" as const, label: "好友私聊" },
        { id: "player-preparation" as const, label: "备战区域" },
        { id: "player-shop" as const, label: "商店" },
      ];
    case "designer":
      return [
        { id: "user-profile" as const, label: "个人主页" },
        { id: "designer-portfolio" as const, label: "作品集" },
        { id: "designer-map" as const, label: "创造地图" },
        { id: "designer-birds" as const, label: "鸟类开发" },
      ];
    case "admin":
      if (user.adminLevel === "director") {
        return [
          { id: "user-profile" as const, label: "个人主页" },
          { id: "admin-director" as const, label: "总监工作台" },
        ];
      }

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
    case "player-social":
      return "好友与私聊";
    case "player-preparation":
      return "备战区域";
    case "designer-map":
      return "创造地图";
    case "designer-birds":
      return "鸟类开发";
    case "admin-community":
      return "社区管理";
    case "admin-proposal":
      return "提案处理";
    case "admin-director":
      return "总监工作台";
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
    case "player-community":
    case "player-shop":
    case "player-social":
    case "player-preparation":
      return null;
    case "player-levels":
      return hasBoundApiUser && user.apiUserId ? (
        <PlayerPage userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="关卡大厅" user={user} onBound={onUserUpdated} />
      );
    case "designer-map":
      return hasBoundApiUser && user.apiUserId ? (
        <DesignerPage userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="创造地图" user={user} onBound={onUserUpdated} />
      );
    case "designer-birds":
      return null;
    case "admin-community":
      return null;
    case "admin-proposal":
      return hasBoundApiUser && user.apiUserId ? (
        <AdminPage userId={user.apiUserId} />
      ) : (
        <BackendBindingPanel title="提案处理" user={user} onBound={onUserUpdated} />
      );
    case "admin-director":
      return null;
  }
};

export const RoleHomePage = ({
  user,
  onOpenSettings,
  onUserUpdated,
  onOpenDesignerDesign,
  onOpenDesignerPortfolio,
  onNavigate,
}: RoleHomePageProps) => {
  const playerApiUserId = getBoundApiUserId(user);
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
    coins: 0,
    gems: 0,
    checkedIn: false,
  });
  const [shopMessage, setShopMessage] = useState("");
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [playingLevelId, setPlayingLevelId] = useState<string | null>(null);
  const selectedLevel = chainLevels.find((level) => level.id === selectedLevelId) ?? null;
  const playingLevel = chainLevels.find((level) => level.id === playingLevelId) ?? null;

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollLeft = Math.max(0, (viewport.scrollWidth - viewport.clientWidth) / 2);
    viewport.scrollTop = Math.max(0, (viewport.scrollHeight - viewport.clientHeight) / 3);
  }, []);

  useEffect(() => {
    if (user.role !== "player" || !user.apiUserId) {
      return;
    }

    const loadPlayerWallet = async () => {
      const [walletData, checkInData] = await Promise.all([
        getPlayerUiData(user.apiUserId!, "player.wallet"),
        getPlayerUiData(user.apiUserId!, "player.weeklyCheckIn"),
      ]);

      setWallet({
        coins: typeof walletData.coins === "number" ? walletData.coins : 0,
        gems: typeof walletData.gems === "number" ? walletData.gems : 0,
        checkedIn: Boolean(checkInData.signedToday),
      });
    };

    void loadPlayerWallet().catch(() => undefined);
  }, [user.apiUserId, user.role]);

  const openDetail = (nextView: Exclude<DetailView, null>) => {
    if (nextView === "user-profile") {
      onNavigate(OWN_PAGE_PATH);
      setActionOpen(false);
      return;
    }

    if (nextView === "player-community" || nextView === "admin-community") {
      onNavigate(COMMUNITY_HALL_PATH);
      setActionOpen(false);
      return;
    }

    if (nextView === "player-shop") {
      onNavigate(PLAYER_SHOP_PATH);
      setActionOpen(false);
      return;
    }

    if (nextView === "player-social") {
      onNavigate(PLAYER_SOCIAL_PATH);
      setActionOpen(false);
      return;
    }

    if (nextView === "player-preparation") {
      onNavigate(PLAYER_PREPARATION_PATH);
      setActionOpen(false);
      return;
    }

    if (nextView === "admin-director") {
      onNavigate(DIRECTOR_CONSOLE_PATH);
      setActionOpen(false);
      return;
    }

    if (nextView === "admin-proposal") {
      onNavigate(ADMIN_PROPOSALS_PATH);
      setActionOpen(false);
      return;
    }

    if (nextView === "designer-map") {
      onOpenDesignerDesign?.();
      setActionOpen(false);
      return;
    }

    if (nextView === "designer-portfolio") {
      onOpenDesignerPortfolio?.();
      setActionOpen(false);
      return;
    }

    if (nextView === "designer-birds") {
      onNavigate(DESIGNER_BIRDS_PATH);
      setActionOpen(false);
      return;
    }

    setDetailView(nextView);
    setActionOpen(false);
  };

  const handleCheckIn = () => {
    if (user.role !== "player" || !user.apiUserId) {
      return;
    }

    void (async () => {
      if (wallet.checkedIn) {
        setShopMessage("今日已完成签到");
        return;
      }

      try {
        const checkInData = await getPlayerUiData(user.apiUserId!, "player.weeklyCheckIn");
        const activeSlot = typeof checkInData.activeSlot === "number" ? checkInData.activeSlot : -1;
        if (activeSlot <= 0) {
          setShopMessage("今日暂无可领取的签到奖励");
          return;
        }

        const result = await invokePlayerUiAction(user.apiUserId!, "player.weeklyCheckIn.claim", {
          panelId: ROLE_HOME_CHECK_IN_PANEL_ID,
          slot: String(activeSlot),
        });
        const resultWallet = result.wallet;
        if (resultWallet && typeof resultWallet === "object") {
          const walletRecord = resultWallet as Record<string, unknown>;
          setWallet({
            coins: typeof walletRecord.coins === "number" ? walletRecord.coins : wallet.coins,
            gems: typeof walletRecord.gems === "number" ? walletRecord.gems : wallet.gems,
            checkedIn: true,
          });
        } else {
          setWallet((current) => ({ ...current, checkedIn: true }));
        }
        setShopMessage("签到成功，奖励已同步到后端");
        setStatusOpen(true);
      } catch (caught) {
        setShopMessage(caught instanceof Error ? caught.message : "签到失败");
      }
    })();
  };

  const openLevelOverlay = (levelId: string) => {
    setSelectedLevelId(levelId);
    setPlayingLevelId(null);
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

  const closeLevelOverlay = () => {
    setSelectedLevelId(null);
    setPlayingLevelId(null);
  };

  const startLevelDemo = (levelId: string) => {
    setSelectedLevelId(null);
    setPlayingLevelId(levelId);
  };

  const exitLevelDemo = () => {
    setPlayingLevelId(null);
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
          className={`chain-stage-body ${selectedLevel ? "level-overlay-open" : ""}`}
        >
          <div className="corner-anchor top-left">
            <div className="top-left-actions">
              {user.role === "player" ? (
                <>
                  <button
                    type="button"
                    className="corner-button"
                    onClick={() => onNavigate(PLAYER_SHOP_PATH)}
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
                    onClick={closeLevelOverlay}
                  >
                    关闭介绍
                  </button>
                </div>

                <div className="level-overlay-content">
                  <section className="level-preview-card">
                    <div className="level-preview-sheet">
                      <span>{selectedLevel.id === "01" ? "点击右侧“开始游戏”进入试玩" : "白纸简略图"}</span>
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
                      onClick={() => {
                        if (selectedLevel.status === "locked") {
                          setShopMessage("该关卡尚未解锁");
                          return;
                        }

                        if (selectedLevel.id === "01") {
                          startLevelDemo(selectedLevel.id);
                          return;
                        }

                        setShopMessage(`准备进入 ${selectedLevel.title}`);
                      }}
                    >
                      开始游戏
                    </button>
                  </section>
                </div>
              </section>
            </div>
          ) : null}

          {playingLevel ? (
            <div className="level-overlay-backdrop" role="presentation">
              <section className="level-overlay-panel game-overlay-panel" aria-label={`游戏 ${playingLevel.title}`}>
                <div className="level-overlay-content game-overlay-content">
                  <section className="level-preview-card level-preview-card-full game-preview-card">
                    <div className="game-canvas-frame">
                      {playingLevel.id === "01" ? (
                        <LevelPreviewCard
                          source={getStarterLevelSource()}
                          {...(playerApiUserId ? { userId: playerApiUserId } : {})}
                          defaultOpen
                          onExit={exitLevelDemo}
                        />
                      ) : null}
                    </div>
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
                  {getActionOptions(user).map((option) => (
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

      {detailView
        && detailView !== "player-shop"
        && detailView !== "player-social"
        && detailView !== "player-preparation"
        && detailView !== "designer-birds" ? (
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
