import type { FrontendRole } from "../lib/config.js";
import { API_USERS } from "../lib/config.js";

type RoleSwitcherProps = {
  role: FrontendRole;
  onChange: (role: FrontendRole) => void;
};

export const RoleSwitcher = ({ role, onChange }: RoleSwitcherProps) => (
  <div className="role-switcher">
    {(Object.keys(API_USERS) as FrontendRole[]).map((candidate) => (
      <button
        key={candidate}
        type="button"
        className={candidate === role ? "active" : ""}
        onClick={() => onChange(candidate)}
      >
        {API_USERS[candidate].label}
      </button>
    ))}
  </div>
);
