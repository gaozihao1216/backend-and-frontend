import { useMemo, useState, type DragEvent } from "react";
import { evaluateDynamicTextProgram } from "../../lib/dynamic-text-program.js";
import {
  createOutputStatement,
  getMainFlowOutputStatements,
  normalizeDynamicTextProgram,
} from "../../lib/dynamic-text-program-normalize.js";
import {
  buildUiTextRuntimeContext,
  formatUiTextRuntimeContextBlock,
} from "../../lib/ui-text-runtime-context.js";
import type {
  DynamicTextProgram,
  DynamicTextStatement,
  DynamicTextValue,
  DynamicTextVariable,
} from "../../objects/ui-customization/dynamic-text-program.js";
import {
  DYNAMIC_TEXT_VARIABLE_GROUPS,
  DYNAMIC_TEXT_VARIABLE_META,
  getDynamicTextVariableLabel,
} from "../../objects/ui-customization/dynamic-text-program.js";
import type { UiEndpoint } from "../../objects/ui-customization/ui-customization-objects.js";
import type { UiPreviewUser } from "../../objects/ui-customization/preview-user.js";

const DRAG_MIME = "application/x-dynamic-text-block";

type BlockDragPayload =
  | { kind: "palette-output" }
  | { kind: "palette-variable"; variable: DynamicTextVariable }
  | { kind: "stack-output"; index: number };

type DynamicTextBlockEditorProps = {
  program: DynamicTextProgram;
  pageRoleScope: UiEndpoint;
  previewUser?: UiPreviewUser;
  onChange: (nextProgram: DynamicTextProgram) => void;
};

const parseDragPayload = (event: DragEvent): BlockDragPayload | null => {
  const raw = event.dataTransfer.getData(DRAG_MIME);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BlockDragPayload;
  } catch {
    return null;
  }
};

const writeDragPayload = (event: DragEvent, payload: BlockDragPayload) => {
  event.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
  event.dataTransfer.effectAllowed = payload.kind === "stack-output" ? "move" : "copy";
};

const getAvailableVariables = (pageRoleScope: UiEndpoint) =>
  DYNAMIC_TEXT_VARIABLE_GROUPS.map((group) => ({
    ...group,
    variables: DYNAMIC_TEXT_VARIABLE_META.filter((entry) => {
      if (entry.group !== group.id) {
        return false;
      }

      if (entry.playerOnly && pageRoleScope !== "player") {
        return false;
      }

      return true;
    }),
  })).filter((group) => group.variables.length > 0);

const VariableReporterBlock = ({
  variable,
  draggable = true,
  onRemove,
}: {
  variable: DynamicTextVariable;
  draggable?: boolean;
  onRemove?: () => void;
}) => (
  <span
    className="scratch-reporter-block"
    draggable={draggable}
    onDragStart={
      draggable
        ? (event) => {
            writeDragPayload(event, { kind: "palette-variable", variable });
          }
        : undefined
    }
  >
    {getDynamicTextVariableLabel(variable)}
    {onRemove ? (
      <button type="button" className="scratch-inline-remove" onClick={onRemove} aria-label="移除">
        ×
      </button>
    ) : null}
  </span>
);

const OutputPartSlot = ({
  part,
  onChange,
  onRemove,
}: {
  part: DynamicTextValue;
  onChange: (nextPart: DynamicTextValue) => void;
  onRemove?: () => void;
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOver(false);

    const payload = parseDragPayload(event);
    if (payload?.kind === "palette-variable") {
      onChange({ type: "variable", name: payload.variable });
    }
  };

  if (part.type === "variable") {
    return (
      <span
        className={`scratch-slot scratch-slot-filled${dragOver ? " drag-over" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <VariableReporterBlock
          variable={part.name}
          draggable={false}
          onRemove={() => onChange({ type: "literal", text: "" })}
        />
        {onRemove ? (
          <button type="button" className="scratch-slot-remove" onClick={onRemove} aria-label="删除插槽">
            −
          </button>
        ) : null}
      </span>
    );
  }

  return (
    <span
      className={`scratch-slot${dragOver ? " drag-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        className="scratch-slot-input"
        value={part.text}
        placeholder="文字"
        onChange={(event) => onChange({ type: "literal", text: event.target.value })}
      />
      {onRemove ? (
        <button type="button" className="scratch-slot-remove" onClick={onRemove} aria-label="删除插槽">
          −
        </button>
      ) : null}
    </span>
  );
};

const OutputCommandBlock = ({
  statement,
  index,
  onChange,
  onRemove,
  onReorder,
}: {
  statement: Extract<DynamicTextStatement, { type: "output" }>;
  index: number;
  onChange: (nextStatement: Extract<DynamicTextStatement, { type: "output" }>) => void;
  onRemove: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) => {
  const [dragOver, setDragOver] = useState(false);

  const updatePart = (partIndex: number, nextPart: DynamicTextValue) => {
    const nextParts = [...statement.parts];
    nextParts[partIndex] = nextPart;
    onChange({ ...statement, parts: nextParts });
  };

  const addPart = () => {
    onChange({
      ...statement,
      parts: [...statement.parts, { type: "literal", text: "" }],
    });
  };

  const removePart = (partIndex: number) => {
    if (statement.parts.length <= 1) {
      return;
    }

    onChange({
      ...statement,
      parts: statement.parts.filter((_, currentIndex) => currentIndex !== partIndex),
    });
  };

  return (
    <div
      className={`scratch-command-block${dragOver ? " drag-over" : ""}`}
      draggable
      onDragStart={(event) => {
        writeDragPayload(event, { kind: "stack-output", index });
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDragOver(false);

        const payload = parseDragPayload(event);
        if (payload?.kind === "stack-output" && payload.index !== index) {
          onReorder(payload.index, index);
        }
      }}
    >
      <span className="scratch-command-label">输出</span>
      <div className="scratch-command-slots">
        {statement.parts.map((part, partIndex) => (
          <OutputPartSlot
            key={`part-${index}-${partIndex}`}
            part={part}
            onChange={(nextPart) => updatePart(partIndex, nextPart)}
            {...(statement.parts.length > 1
              ? { onRemove: () => removePart(partIndex) }
              : {})}
          />
        ))}
        <button type="button" className="scratch-slot-add" onClick={addPart} aria-label="添加插槽">
          +
        </button>
      </div>
      <button type="button" className="scratch-block-remove" onClick={onRemove} aria-label="删除输出积木">
        ×
      </button>
    </div>
  );
};

export const DynamicTextBlockEditor = ({
  program,
  pageRoleScope,
  previewUser,
  onChange,
}: DynamicTextBlockEditorProps) => {
  const [stackDragOver, setStackDragOver] = useState(false);
  const normalizedProgram = useMemo(() => normalizeDynamicTextProgram(program), [program]);
  const outputStatements = useMemo(
    () => getMainFlowOutputStatements(normalizedProgram),
    [normalizedProgram],
  );
  const runtimeContext = useMemo(() => buildUiTextRuntimeContext(previewUser), [previewUser]);
  const previewText = useMemo(
    () => evaluateDynamicTextProgram(normalizedProgram, previewUser),
    [normalizedProgram, previewUser],
  );
  const variableGroups = useMemo(() => getAvailableVariables(pageRoleScope), [pageRoleScope]);

  const commitOutputs = (nextOutputs: Extract<DynamicTextStatement, { type: "output" }>[]) => {
    onChange({ statements: nextOutputs });
  };

  const insertOutputAt = (index: number, statement = createOutputStatement()) => {
    const nextOutputs = [...outputStatements];
    nextOutputs.splice(index, 0, statement);
    commitOutputs(nextOutputs);
  };

  const updateOutputAt = (
    index: number,
    nextStatement: Extract<DynamicTextStatement, { type: "output" }>,
  ) => {
    const nextOutputs = [...outputStatements];
    nextOutputs[index] = nextStatement;
    commitOutputs(nextOutputs);
  };

  const removeOutputAt = (index: number) => {
    commitOutputs(outputStatements.filter((_, currentIndex) => currentIndex !== index));
  };

  const reorderOutputs = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    const nextOutputs = [...outputStatements];
    const [moved] = nextOutputs.splice(fromIndex, 1);
    if (!moved) {
      return;
    }

    nextOutputs.splice(toIndex, 0, moved);
    commitOutputs(nextOutputs);
  };

  const handleStackDrop = (event: DragEvent, insertIndex: number) => {
    event.preventDefault();
    setStackDragOver(false);

    const payload = parseDragPayload(event);
    if (!payload) {
      return;
    }

    if (payload.kind === "palette-output") {
      insertOutputAt(insertIndex);
      return;
    }

    if (payload.kind === "stack-output") {
      const targetIndex = payload.index < insertIndex ? insertIndex - 1 : insertIndex;
      reorderOutputs(payload.index, targetIndex);
    }
  };

  return (
    <section className="scratch-block-editor">
      <div className="scratch-block-context">
        <strong>可用账号字段</strong>
        <pre>{runtimeContext ? formatUiTextRuntimeContextBlock(runtimeContext) : "{}"}</pre>
      </div>

      <div className="scratch-block-layout">
        <aside className="scratch-block-palette">
          <h4>积木库</h4>
          <div
            className="scratch-palette-block scratch-command-block scratch-palette-output"
            draggable
            onDragStart={(event) => writeDragPayload(event, { kind: "palette-output" })}
          >
            <span className="scratch-command-label">输出</span>
            <span className="scratch-slot scratch-slot-ghost">文字 / 字段</span>
          </div>

          {variableGroups.map((group) => (
            <div key={group.id} className="scratch-palette-group">
              <span>{group.label}</span>
              <div className="scratch-palette-reporters">
                {group.variables.map((entry) => (
                  <VariableReporterBlock key={entry.name} variable={entry.name} />
                ))}
              </div>
            </div>
          ))}
        </aside>

        <div className="scratch-block-workspace">
          <div className="scratch-hat-block">
            <div className="scratch-hat-label">主流程</div>
            <div
              className={`scratch-stack${stackDragOver ? " drag-over" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setStackDragOver(true);
              }}
              onDragLeave={() => setStackDragOver(false)}
              onDrop={(event) => handleStackDrop(event, outputStatements.length)}
            >
              {outputStatements.length === 0 ? (
                <p className="scratch-stack-empty">将左侧「输出」积木拖入此处，开始拼接主流程。</p>
              ) : (
                outputStatements.map((statement, index) => (
                  <div key={`output-${index}`} className="scratch-stack-item">
                    <div
                      className="scratch-stack-drop-line"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => handleStackDrop(event, index)}
                    />
                    <OutputCommandBlock
                      statement={statement}
                      index={index}
                      onChange={(nextStatement) => updateOutputAt(index, nextStatement)}
                      onRemove={() => removeOutputAt(index)}
                      onReorder={reorderOutputs}
                    />
                  </div>
                ))
              )}
              {outputStatements.length > 0 ? (
                <div
                  className="scratch-stack-drop-line scratch-stack-drop-line-end"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleStackDrop(event, outputStatements.length)}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="dynamic-text-preview">
        <span>预览结果</span>
        <strong>{previewText || "（空）"}</strong>
      </div>
    </section>
  );
};
