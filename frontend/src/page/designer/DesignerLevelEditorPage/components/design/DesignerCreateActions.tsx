type DesignerCreateActionsProps = {
  isTitleMissing: boolean;
  onCreate: () => void;
};

export const DesignerCreateActions = ({
  isTitleMissing,
  onCreate,
}: DesignerCreateActionsProps) => (
  <div className="designer-create-actions">
    <button type="button" disabled={isTitleMissing} onClick={onCreate}>
      Create Level
    </button>
    {isTitleMissing ? <p className="feedback error">请先填写 Title。</p> : null}
  </div>
);
