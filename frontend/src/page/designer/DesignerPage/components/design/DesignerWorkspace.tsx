import type { ReactNode } from "react";

type DesignerWorkspaceProps = {
  children: ReactNode;
};

export const DesignerWorkspace = ({ children }: DesignerWorkspaceProps) => (
  <div className="designer-layout">
    <div className="designer-main-column">{children}</div>
  </div>
);
