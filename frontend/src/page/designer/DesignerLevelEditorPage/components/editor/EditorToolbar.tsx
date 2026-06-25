import type { EditorTool } from "../../../../../level/function/designer-level.js";

type EditorToolbarProps = {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
};

const tools: Array<{ tool: EditorTool; label: string }> = [
  { tool: "select", label: "选择" },
  { tool: "rotate", label: "旋转" },
  { tool: "add-wood", label: "添加木块" },
  { tool: "add-stone", label: "添加石块" },
  { tool: "add-glass", label: "添加玻璃" },
  { tool: "add-pig", label: "添加猪" },
];

export const EditorToolbar = ({ activeTool, onToolChange }: EditorToolbarProps) => {
  return (
    <div className="actions designer-toolbar">
      {/* 工具栏只负责切换“当前意图”，具体行为由画布层解释。 */}
      {tools.map((item) => (
        <button
          key={item.tool}
          type="button"
          className={item.tool === activeTool ? "" : "secondary"}
          onClick={() => onToolChange(item.tool)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};
