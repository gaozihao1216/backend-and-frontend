import type { ButtonDesignViewModel } from "../hooks/useDirectorButtonDesign.js";

type ButtonDesignImageCropPanelProps = {
  design: ButtonDesignViewModel;
};

export const ButtonDesignImageCropPanel = ({ design }: ButtonDesignImageCropPanelProps) => (
  <section className="button-design-source-panel">
    <h3>图案截取</h3>
    <label className="button-design-file-drop">
      <input type="file" accept="image/*" onChange={design.handleImageSelect} />
      <span>{design.imageSourceName || "选择一张白底图案图片"}</span>
    </label>
    <label className="button-design-paste-field">
      <span>粘贴图片</span>
      <textarea
        value={design.pastedImageValue}
        onChange={(event) => {
          design.setPastedImageValue(event.target.value);
          design.clearFeedback();
        }}
        onPaste={design.handlePasteImage}
        placeholder="在这里 Ctrl+V 粘贴图片，或粘贴 data:image/... 内容"
      />
    </label>
    <button type="button" className="secondary" onClick={design.handleLoadPastedImage}>
      载入粘贴内容
    </button>
    {design.imageSourceDataUrl ? (
      <div className="button-design-source-preview">
        <button
          type="button"
          className="button-design-image-stage"
          onClick={design.handleImageStageClick}
          onPointerDown={design.handleScanAreaDrawStart}
          onPointerMove={design.handleScanAreaDrawMove}
          onPointerUp={design.handleScanAreaDrawEnd}
          onPointerCancel={design.handleScanAreaDrawEnd}
        >
          <img src={design.imageSourceDataUrl} alt="按钮图案素材" />
          <span
            className="button-design-scan-area"
            style={{
              left: `${design.scanArea.x}%`,
              top: `${design.scanArea.y}%`,
              width: `${design.scanArea.width}%`,
              height: `${design.scanArea.height}%`,
            }}
          />
          <svg
            className="button-design-polygon-layer"
            viewBox="0 0 100 100"
            aria-hidden="true"
            onPointerMove={design.handlePolygonPointMove}
            onPointerUp={design.handlePolygonPointDragEnd}
            onPointerCancel={design.handlePolygonPointDragEnd}
          >
            {design.polygonPoints.length > 1 ? (
              <polyline
                points={design.polygonPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                className="button-design-polygon-line"
              />
            ) : null}
            {design.polygonPoints.length > 2 ? (
              <polygon
                points={design.polygonPoints.map((point) => `${point.x},${point.y}`).join(" ")}
                className="button-design-polygon-fill"
              />
            ) : null}
            {design.polygonPoints.map((point, index) => (
              <circle
                key={`${point.x}-${point.y}-${index}`}
                cx={point.x}
                cy={point.y}
                r="0.5"
                onPointerDown={design.handlePolygonPointPointerDown(index)}
                onClick={(event) => event.stopPropagation()}
              />
            ))}
          </svg>
        </button>
      </div>
    ) : (
      <div className="button-design-empty-source">暂无图片</div>
    )}
    <p className="meta">按住图片拖拽，用两个对角点确定自动识别范围。</p>
    <div className="button-design-source-actions">
      <button type="button" disabled={!design.imageSourceDataUrl} onClick={design.handleAutoTrace}>
        自动打点
      </button>
      <button
        type="button"
        className="secondary"
        disabled={design.polygonPoints.length === 0}
        onClick={design.undoPolygonPoint}
      >
        撤销点
      </button>
      <button
        type="button"
        className="secondary"
        disabled={design.polygonPoints.length === 0}
        onClick={design.resetPolygon}
      >
        重置区域
      </button>
    </div>
    <p className="meta">已选择 {design.polygonPoints.length} 个点，至少 3 个点可生成闭合图案。</p>
  </section>
);
