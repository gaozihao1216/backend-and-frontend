type DesignerGridControlsProps = {
  gridSize: number;
  onGridSizeChange: (gridSize: number) => void;
};

export const DesignerGridControls = ({
  gridSize,
  onGridSizeChange,
}: DesignerGridControlsProps) => (
  <div className="designer-grid-controls">
    <label className="designer-grid-size">
      <span>网格间距</span>
      <select value={gridSize} onChange={(event) => onGridSizeChange(Number(event.target.value))}>
        <option value={8}>8</option>
        <option value={16}>16</option>
        <option value={24}>24</option>
      </select>
    </label>
  </div>
);
