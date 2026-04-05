import type { AuthUser } from "../lib/auth.js";

type SettingsPanelProps = {
  user: AuthUser;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

const roleNames = {
  player: "玩家",
  designer: "设计师",
  admin: "管理员",
} as const;

export const SettingsPanel = ({
  user,
  open,
  onClose,
  onLogout,
}: SettingsPanelProps) => {
  if (!open) {
    return null;
  }

  const createdAtLabel = new Date(user.createdAt).toLocaleString("zh-CN", {
    hour12: false,
  });

  return (
    <div className="settings-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-label="设置"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-header">
          <div>
            <p className="eyebrow">Settings</p>
            <h3>账号设置</h3>
          </div>
          <button type="button" className="secondary" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="settings-summary">
          <p>
            <strong>昵称：</strong>
            {user.nickname}
          </p>
          <p>
            <strong>角色：</strong>
            {roleNames[user.role]}
          </p>
          <p>
            <strong>用户 ID：</strong>
            {user.id}
          </p>
          <p>
            <strong>注册时间：</strong>
            {createdAtLabel}
          </p>
        </div>
        <button type="button" onClick={onLogout}>
          退出登录
        </button>
      </aside>
    </div>
  );
};
