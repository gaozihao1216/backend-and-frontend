import { useEffect, useState } from "react";
import { AuthLandingPage } from "./components/auth/AuthLandingPage.js";
import { RoleHomePage } from "./components/RoleHomePage.js";
import { SettingsPanel } from "./components/SettingsPanel.js";
import { persistAuthSession, readPersistedAuthUser, type AuthUser } from "./lib/auth.js";

export const App = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => readPersistedAuthUser());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    persistAuthSession(currentUser);
  }, [currentUser]);

  return (
    <main className="app-shell">
      {currentUser ? (
        <>
          <RoleHomePage
            user={currentUser}
            onOpenSettings={() => setSettingsOpen(true)}
            onUserUpdated={setCurrentUser}
          />
          <SettingsPanel
            user={currentUser}
            open={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onLogout={() => {
              setSettingsOpen(false);
              setCurrentUser(null);
            }}
          />
        </>
      ) : (
        <AuthLandingPage onAuthenticated={setCurrentUser} />
      )}
    </main>
  );
};
