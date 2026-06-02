type VoidSpanControlsProps = {
  visible: boolean;
  selectedVoidSpanId: string | null;
  onRemoveVoidSpan: () => void;
};

export const VoidSpanControls = ({
  visible,
  selectedVoidSpanId,
  onRemoveVoidSpan,
}: VoidSpanControlsProps) => (
  <>
    {visible ? (
      <div className="designer-grid-controls designer-ground-controls">
        <button
          type="button"
          className="secondary"
          disabled={!selectedVoidSpanId}
          onClick={onRemoveVoidSpan}
        >
          删除当前虚空段
        </button>
      </div>
    ) : null}
  </>
);
