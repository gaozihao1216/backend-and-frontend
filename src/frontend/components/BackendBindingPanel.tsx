import { useState } from "react";
import { ensureBackendBoundAuthUser, type AuthUser } from "../lib/auth.js";

type BackendBindingPanelProps = {
  title: string;
  user: AuthUser;
  onBound: (user: AuthUser) => void;
};

export const BackendBindingPanel = ({ title, user, onBound }: BackendBindingPanelProps) => {
  const [binding, setBinding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleBind = async () => {
    setBinding(true);
    setMessage("");
    setError("");

    try {
      const updatedUser = await ensureBackendBoundAuthUser(user);

      setMessage(`已同步后端账号 ${updatedUser.apiUserId}`);
      onBound(updatedUser);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "同步后端账号失败");
    } finally {
      setBinding(false);
    }
  };

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="panel-copy">
        当前账号 {user.nickname} 还没有可用的后端身份。新注册的设计师和管理员会自动开通后端账号；如果这是旧账号，只需补做一次同步即可继续使用完整功能。
      </p>
      <button type="button" onClick={() => void handleBind()} disabled={binding}>
        {binding ? "同步中..." : "同步后端账号"}
      </button>
      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}
    </section>
  );
};
