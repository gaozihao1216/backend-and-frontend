type JsonCheckPanelProps = {
  title: string;
  description: string;
  label: string;
  value: string;
  error?: string;
  readOnly?: boolean;
  onExit?: (() => void) | undefined;
  onConfirm?: (() => void) | undefined;
  onChange?: ((value: string) => void) | undefined;
};

export const JsonCheckPanel = ({
  title,
  description,
  label,
  value,
  error,
  readOnly = false,
  onExit,
  onConfirm,
  onChange,
}: JsonCheckPanelProps) => (
  <section className="panel designer-workspace-panel designer-json-check-page">
    <div className="actions">
      <button type="button" className="secondary" onClick={onExit}>
        退出
      </button>
      {onConfirm ? (
        <button type="button" onClick={onConfirm}>
          确认修改
        </button>
      ) : null}
    </div>
    <h2>{title}</h2>
    <p className="panel-copy">{description}</p>
    <label className="designer-json-check-panel">
      <span>{label}</span>
      <textarea
        rows={26}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        spellCheck={false}
      />
      {error ? <span className="designer-json-error">{error}</span> : null}
    </label>
  </section>
);
