import type { PageConfig } from "../ui/page-config.js";

const PAGE_ID = "admin.proposals";

const flowPosition = () => ({
  unit: "percent" as const,
  x: 0,
  y: 0,
  width: 100,
  height: 1,
});

const componentId = (suffix: string) => `${PAGE_ID}.${suffix}`;

export const createAdminProposalsLayout = (): PageConfig["layout"] => ({
  type: "stack",
  gap: 12,
  padding: 0,
});

export const createAdminProposalsComponents = (): PageConfig["components"] => [
  {
    id: componentId("title"),
    type: "text",
    text: "提案处理",
    artTextDesign: {
      preset: "goldGradient",
    },
    position: flowPosition(),
    style: {
      backgroundColor: "transparent",
      textColor: "#12202f",
      fontSize: 22,
    },
  },
  {
    id: componentId("copy"),
    type: "text",
    text: "审核设计师提交的关卡与鸟类设计提案。",
    position: flowPosition(),
    style: {
      backgroundColor: "transparent",
      textColor: "#3e544f",
    },
  },
  {
    id: componentId("reviewWidget"),
    type: "widget",
    widgetId: "adminProposalReview",
    position: flowPosition(),
  },
];

export const createAdminProposalsPageConfig = (): PageConfig => ({
  id: PAGE_ID,
  name: "提案处理",
  path: "/admin/proposals",
  roleScope: "admin",
  layout: createAdminProposalsLayout(),
  surfaceMode: "composed",
  components: createAdminProposalsComponents(),
});
