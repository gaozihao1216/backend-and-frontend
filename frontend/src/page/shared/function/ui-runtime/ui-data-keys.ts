import type {
  ButtonComponent,
  PageComponent,
  PageConfig,
  PanelComponent,
  TextComponent,
} from "../../../../objects/ui-customization/ui-customization-objects.js";
import {
  PLAYER_LEVEL_PROGRESS_UI_DATA_KEY,
  PLAYER_WALLET_UI_DATA_KEY,
} from "../ui-config/ui-text-runtime-context.js";

const hasApiDataSource = (
  component: PageComponent,
): component is ButtonComponent | PanelComponent =>
  (component.type === "button" || component.type === "panel")
  && component.dataSource?.type === "api"
  && Boolean(component.dataSource.apiKey);

export const collectComponentUiDataKeys = (component: PageComponent): string[] => {
  const keys: string[] = [];

  if (hasApiDataSource(component)) {
    keys.push(component.dataSource!.apiKey!);
  }

  if (component.type === "button" && component.stateDesign?.stateSource?.apiKey) {
    keys.push(component.stateDesign.stateSource.apiKey);
  }

  return keys;
};

const ACCOUNT_DYNAMIC_TEXT_VARIABLES = new Set(["coins", "gems", "fragments", "clearedLevelCount"]);

const collectVariablesFromDynamicProgram = (
  program: TextComponent["dynamicTextProgram"],
  variables: Set<string>,
) => {
  if (!program) {
    return;
  }

  const visitValue = (value: { type: string; name?: string }) => {
    if (value.type === "variable" && value.name) {
      variables.add(value.name);
    }
  };

  const visitStatements = (statements: NonNullable<TextComponent["dynamicTextProgram"]>["statements"]) => {
    for (const statement of statements) {
      if (statement.type === "output") {
        for (const part of statement.parts ?? []) {
          visitValue(part);
        }
        if ("value" in statement && statement.value) {
          visitValue(statement.value as { type: string; name?: string });
        }
        continue;
      }

      visitValue(statement.left);
      visitValue(statement.right);
      visitStatements(statement.then);
      if (statement.else) {
        visitStatements(statement.else);
      }
    }
  };

  visitStatements(program.statements);
};

const collectDynamicTextUiDataKeys = (page: PageConfig): string[] => {
  if (page.roleScope !== "player") {
    return [];
  }

  const variables = new Set<string>();
  page.components.forEach((component) => {
    if (component.type !== "text") {
      return;
    }

    if (component.textContentMode === "dynamic") {
      collectVariablesFromDynamicProgram(component.dynamicTextProgram, variables);
    }

    for (const variable of ACCOUNT_DYNAMIC_TEXT_VARIABLES) {
      if (component.text.includes(`{{${variable}}}`)) {
        variables.add(variable);
      }
    }
  });

  const keys: string[] = [];
  if ([...variables].some((name) => name === "coins" || name === "gems" || name === "fragments")) {
    keys.push(PLAYER_WALLET_UI_DATA_KEY);
  }
  if (variables.has("clearedLevelCount")) {
    keys.push(PLAYER_LEVEL_PROGRESS_UI_DATA_KEY);
  }
  return keys;
};

export const collectPageUiDataKeys = (page: PageConfig): string[] => {
  const keys = new Set<string>();
  page.components.forEach((component) => {
    collectComponentUiDataKeys(component).forEach((key) => keys.add(key));
  });
  collectDynamicTextUiDataKeys(page).forEach((key) => keys.add(key));
  return [...keys];
};

export const collectPanelOpenRefreshKeys = (
  page: PageConfig,
  openPanelIds: Set<string>,
): string[] => {
  const keys = new Set<string>();

  page.components.forEach((component) => {
    if (component.type !== "panel" || !openPanelIds.has(component.id)) {
      return;
    }

    component.childComponentIds.forEach((childId) => {
      const child = page.components.find((candidate) => candidate.id === childId);
      if (!child || !hasApiDataSource(child) || child.dataSource!.refreshMode !== "onOpen") {
        return;
      }

      keys.add(child.dataSource!.apiKey!);
    });
  });

  return [...keys];
};
