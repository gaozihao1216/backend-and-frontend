import { useCallback, useEffect, useMemo, useState } from "react";
import { getPlayerUiData } from "../../../../api/player/ui/GetPlayerUiDataApi.js";
import { invokePlayerUiAction } from "../../../../api/player/ui/InvokePlayerUiActionApi.js";
import { collectPageUiDataKeys } from "../../function/ui-runtime/ui-data-keys.js";
import type { PageConfig } from "../../../../objects/ui-customization/ui-customization-objects.js";

/**
 * 动态 UI 页面运行时数据 hook。
 *
 * PageConfig 只描述组件结构；真正的玩家数据和按钮动作通过后端 UI runtime API 获取。
 * 该 hook 统一管理数据刷新和 action 调用，供 DynamicPageRenderer 注入到各组件上下文。
 */
export const useUiPageRuntime = (page: PageConfig, userId?: string) => {
  const [uiData, setUiData] = useState<Record<string, unknown>>({});
  const dataKeys = useMemo(() => collectPageUiDataKeys(page), [page]);

  // targetKeys 为空时刷新整页声明的数据；面板展开时可只刷新局部 key。
  const refreshUiData = useCallback(async (targetKeys?: string[]) => {
    if (!userId) {
      return;
    }

    const keysToFetch = targetKeys ?? dataKeys;
    if (keysToFetch.length === 0) {
      return;
    }

    const entries = await Promise.all(
      keysToFetch.map(async (apiKey) => {
        try {
          const data = await getPlayerUiData(userId, apiKey);
          return [apiKey, data] as const;
        } catch {
          return null;
        }
      }),
    );

    const nextEntries = entries.filter((entry): entry is readonly [string, Record<string, unknown>] => entry != null);
    if (nextEntries.length === 0) {
      return;
    }

    setUiData((current) => ({
      ...current,
      ...Object.fromEntries(nextEntries),
    }));
  }, [dataKeys, userId]);

  useEffect(() => {
    void refreshUiData();
  }, [refreshUiData]);

  const invokeUiAction = useCallback(async (apiKey: string, params?: Record<string, string>) => {
    if (!userId) {
      return null;
    }

    const result = await invokePlayerUiAction(userId, apiKey, params);
    await refreshUiData();
    return result;
  }, [refreshUiData, userId]);

  return {
    uiData,
    refreshUiData,
    invokeUiAction,
  };
};
