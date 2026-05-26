type LevelDataInspectorProps = {
  jsonText: string;
  error?: string;
  onChange: (nextJsonText: string) => void;
};

export const LevelDataInspector = ({ jsonText, error, onChange }: LevelDataInspectorProps) => {
  return (
    <label className="designer-json-panel">
      <span>LevelData JSON</span>
      <textarea rows={20} value={jsonText} onChange={(event) => onChange(event.target.value)} spellCheck={false} />
      {error ? <span className="designer-json-error">{error}</span> : null}
    </label>
  );
};
