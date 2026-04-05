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

      setMessage(`已绑定后端账号 ${updatedUser.apiUserId}`);
      onBound(updatedUser);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "绑定后端账号失败");
    } finally {
      setBinding(false);
    }
  };

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="panel-copy">
        当前账号 {user.nickname} 是前端本地注册账号，尚未绑定后端用户。完成绑定后即可使用完整社区功能。
      </p>
      <button type="button" onClick={() => void handleBind()} disabled={binding}>
        {binding ? "Binding..." : "Bind Backend Account"}
      </button>
      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}
    </section>
  );
};
