import { useEffect, useState } from "react";
import { API_USERS, type FrontendRole } from "../../lib/config.js";
import {
  ensureBackendBoundAuthUser,
  getCurrentDirectorAccountHint,
  getSeedAccountHint,
  loginWithLocalAuth,
  registerWithLocalAuth,
  type AuthRole,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
} from "../../lib/auth.js";

type AuthLandingPageProps = {
  onAuthenticated: (user: AuthUser) => void;
};

type AuthMode = "login" | "register";

const roleDescriptions: Record<FrontendRole, string> = {
  player: "查看链条关卡、金币与社区入口",
  designer: "管理链条关卡，并进入创造地图与鸟类开发",
  admin: "查看链条关卡，并进入社区管理与提案处理",
};

const roleNames: Record<FrontendRole, string> = {
  player: "玩家",
  designer: "设计师",
  admin: "管理员",
};

const getInitialAccountHint = (role: FrontendRole, mode: AuthMode) =>
  mode === "login" && role === "admin" ? "正在读取当前总监账号..." : getSeedAccountHint(role);

export const AuthLandingPage = ({ onAuthenticated }: AuthLandingPageProps) => {
  const [role, setRole] = useState<FrontendRole>("player");
  const [mode, setMode] = useState<AuthMode>("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [accountHint, setAccountHint] = useState(getInitialAccountHint(role, mode));

  useEffect(() => {
    let cancelled = false;
    setAccountHint(getInitialAccountHint(role, mode));

    if (mode !== "login" || role !== "admin") {
      return () => {
        cancelled = true;
      };
    }

    void getCurrentDirectorAccountHint()
      .then((hint) => {
        if (!cancelled) {
          setAccountHint(hint);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccountHint("当前总监账号读取失败，请稍后重试");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, role]);

  const resetFeedback = () => {
    setMessage("");
    setError("");
  };

  const handleRoleChange = (nextRole: FrontendRole) => {
    setRole(nextRole);
    setInviteCode("");
    resetFeedback();
  };

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const finalizeAuthentication = async (user: AuthUser) => {
    const updatedUser = await ensureBackendBoundAuthUser(user);
    onAuthenticated(updatedUser);
  };

  const handleLogin = async () => {
    resetFeedback();
    const result = loginWithLocalAuth({
      role,
      nickname,
      password,
    } satisfies LoginInput);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSubmitting(true);

    try {
      await finalizeAuthentication(result.data);
      setMessage(`欢迎回来，${result.data.nickname}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "同步后端账号失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    resetFeedback();
    const input: RegisterInput =
      role === "player"
        ? {
            role,
            nickname,
            password,
          }
        : {
            role: role as Extract<AuthRole, "designer" | "admin">,
            nickname,
            password,
            inviteCode,
          };

    setSubmitting(true);

    try {
      const result = await registerWithLocalAuth(input);
      if (!result.success) {
        setError(result.message);
        return;
      }

      const authenticatedUser =
        result.data.apiUserId ? result.data : await ensureBackendBoundAuthUser(result.data);
      onAuthenticated(authenticatedUser);
      setMessage(`注册成功，已进入${roleNames[result.data.role]}主页`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "创建或同步后端账号失败");
    } finally {
      setSubmitting(false);
    }
  };

  const requiresInviteCode = role === "designer" || role === "admin";

  return (
    <section className="auth-shell">
      <div className="auth-showcase hero">
        <p className="eyebrow">Three Roles</p>
        <h1>选择身份后登录或注册，进入对应的主界面</h1>
        <p className="hero-copy">
          本地账号会保存在浏览器中；新注册的设计师和管理员会自动开通后端账号，登录后可直接进入对应主页。
        </p>
        <div className="role-cards">
          {(Object.keys(API_USERS) as FrontendRole[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={`role-card ${candidate === role ? "active" : ""}`}
              onClick={() => handleRoleChange(candidate)}
            >
              <strong>{roleNames[candidate]}</strong>
              <span>{roleDescriptions[candidate]}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="auth-panel panel">
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : "secondary"}
            onClick={() => handleModeChange("login")}
          >
            登录
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : "secondary"}
            onClick={() => handleModeChange("register")}
          >
            注册
          </button>
        </div>

        <p className="panel-copy">
          当前身份：{roleNames[role]}。
          {mode === "register"
            ? "设计师与管理员需输入验证码 66260696，注册成功后会自动开通对应后端账号"
            : "请输入昵称和密码完成登录"}
        </p>
        {mode === "login" ? <p className="meta">{accountHint}</p> : null}

        <label>
          <span>昵称</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>

        <label>
          <span>密码</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {mode === "register" && requiresInviteCode ? (
          <label>
            <span>验证码</span>
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
            />
          </label>
        ) : null}

        <button
          type="button"
          className="auth-submit"
          onClick={() => void (mode === "login" ? handleLogin() : handleRegister())}
          disabled={submitting}
        >
          {submitting
            ? "处理中..."
            : mode === "login"
              ? `以${roleNames[role]}身份登录`
              : `注册${roleNames[role]}账号`}
        </button>

        {message ? <p className="feedback success">{message}</p> : null}
        {error ? <p className="feedback error">{error}</p> : null}
      </section>
    </section>
  );
};
