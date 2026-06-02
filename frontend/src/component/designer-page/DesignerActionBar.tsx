type DesignerActionBarProps = {
  undoDisabled: boolean;
  redoDisabled: boolean;
  deleteSelectedDisabled: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCreateBackup: () => void;
  onDeleteSelected: () => void;
  onOpenJsonCheck?: (() => void) | undefined;
};

export const DesignerActionBar = ({
  undoDisabled,
  redoDisabled,
  deleteSelectedDisabled,
  onUndo,
  onRedo,
  onCreateBackup,
  onDeleteSelected,
  onOpenJsonCheck,
}: DesignerActionBarProps) => (
  <div className="actions">
    <button
      type="button"
      className="secondary"
      disabled={undoDisabled}
      onClick={onUndo}
    >
      撤销
    </button>
    <button
      type="button"
      className="secondary"
      disabled={redoDisabled}
      onClick={onRedo}
    >
      恢复
    </button>
    <button
      type="button"
      className="secondary"
      onClick={onCreateBackup}
    >
      保存备份
    </button>
    <button
      type="button"
      className="secondary"
      disabled={deleteSelectedDisabled}
      onClick={onDeleteSelected}
    >
      删除选中对象
    </button>
    <button
      type="button"
      className="secondary"
      onClick={onOpenJsonCheck}
    >
      查看或修改Json文件
    </button>
  </div>
);
