import { AdminCommunityPage } from "./AdminCommunityPage.js";
import { AdminPage } from "./AdminPage.js";
import { DesignerHomePage } from "./DesignerHomePage.js";
import { PlayerCommunityPage } from "./PlayerCommunityPage.js";
import { PlayerShopPage } from "./PlayerShopPage.js";
import { UserProfilePage } from "./UserProfilePage.js";
import type {
  PageConfig,
  UiPreviewUser,
} from "../objects/ui-customization/ui-customization-objects.js";

type UiActualPagePreviewProps = {
  page: PageConfig;
  previewUser: UiPreviewUser;
};

export const UiActualPagePreview = ({ page, previewUser }: UiActualPagePreviewProps) => {
  switch (page.id) {
    case "admin.proposals":
      return <AdminPage userId={previewUser.apiUserId} />;
    case "admin.community":
      return <AdminCommunityPage nickname={previewUser.nickname} userId={previewUser.apiUserId} />;
    case "player.community":
      return <PlayerCommunityPage nickname={previewUser.nickname} userId={previewUser.apiUserId} />;
    case "player.shop":
      return <PlayerShopPage userId="player-1" />;
    case "shared.profile":
      return <UserProfilePage viewerUserId={previewUser.apiUserId} profileUserId={previewUser.apiUserId} />;
    case "designer.home":
      return (
        <DesignerHomePage
          onOpenDesignWindow={() => undefined}
          onOpenPortfolio={() => undefined}
        />
      );
    default:
      return (
        <section className="panel page-builder-preview-error">
          <h2>暂未接入真实页面预览</h2>
          <p className="panel-copy">
            该页面还没有映射到真实 React 页面组件，不能用演示配置代替真实账号视角。
          </p>
          <code>{page.id}</code>
        </section>
      );
  }
};
