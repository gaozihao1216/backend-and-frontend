import type { PageConfig, UiPreviewUser } from "../../../objects/ui-customization/ui-customization-objects.js";
import { renderStaticPage, type StaticPageRenderContext } from "../StaticPageRenderer/index.js";

type UiActualPagePreviewProps = {
  page: PageConfig;
  previewUser: UiPreviewUser;
  pathname?: string | undefined;
  onNavigate?: ((path: string) => void) | undefined;
};

export const UiActualPagePreview = ({
  page,
  previewUser,
  pathname = page.path,
  onNavigate = () => undefined,
}: UiActualPagePreviewProps) => {
  const context: StaticPageRenderContext = {
    user: {
      id: previewUser.apiUserId,
      nickname: previewUser.nickname,
      role: previewUser.roleScope === "designer"
        ? "designer"
        : previewUser.roleScope === "admin" || previewUser.roleScope === "director"
          ? "admin"
          : "player",
      createdAt: new Date(0).toISOString(),
      apiUserId: previewUser.apiUserId,
      ...(previewUser.roleScope === "director" ? { adminLevel: "director" as const } : {}),
    },
    pathname,
    search: "",
    onNavigate,
  };

  return renderStaticPage(page.id, context);
};
