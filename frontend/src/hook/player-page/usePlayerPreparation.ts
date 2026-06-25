import { useCallback, useEffect, useState } from "react";
import { ascendPlayerBird } from "../../api/player/preparation/AscendPreparationBirdApi.js";
import { getPlayerPreparation } from "../../api/player/preparation/GetPreparationStateApi.js";
import { upgradePlayerBird } from "../../api/player/preparation/UpgradePreparationBirdApi.js";
import { upgradePlayerSlingshot } from "../../api/player/preparation/UpgradePreparationSlingshotApi.js";
import type { BirdUpgradeState, PlayerPreparationState } from "../../objects/player/preparation/player-preparation.js";
import { readSelectedBirdType, writeSelectedBirdType } from "../../lib/player-bird-selection.js";

export const usePlayerPreparation = (userId: string) => {
  const [state, setState] = useState<PlayerPreparationState | null>(null);
  const [selectedBirdType, setSelectedBirdType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadState = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextState = await getPlayerPreparation(userId);
      setState(nextState);
      setSelectedBirdType((current) => {
        const stored = readSelectedBirdType(userId);
        if (stored && nextState.birds.some((bird) => bird.birdType === stored)) {
          return stored;
        }

        return current ?? nextState.birds[0]?.birdType ?? null;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载备战数据失败");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const selectedBird: BirdUpgradeState | null =
    state?.birds.find((bird) => bird.birdType === selectedBirdType) ?? null;

  const selectBirdType = (birdType: string) => {
    setSelectedBirdType(birdType);
    writeSelectedBirdType(userId, birdType);
  };

  const handleUpgradeBird = async (birdType: string) => {
    setBusyKey(`upgrade:${birdType}`);
    setError("");
    setNotice("");
    try {
      const nextState = await upgradePlayerBird(userId, birdType);
      setState(nextState);
      const bird = nextState.birds.find((item) => item.birdType === birdType);
      setNotice(bird ? `${bird.name} 已升级至 Lv.${bird.level}` : "升级成功");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "鸟类升级失败");
    } finally {
      setBusyKey(null);
    }
  };

  const handleAscendBird = async (birdType: string) => {
    setBusyKey(`ascend:${birdType}`);
    setError("");
    setNotice("");
    try {
      const nextState = await ascendPlayerBird(userId, birdType);
      setState(nextState);
      const bird = nextState.birds.find((item) => item.birdType === birdType);
      setNotice(bird ? `${bird.name} 已升阶至 ${bird.tier} 阶` : "升阶成功");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "鸟类升阶失败");
    } finally {
      setBusyKey(null);
    }
  };

  const handleUpgradeSlingshot = async () => {
    setBusyKey("slingshot");
    setError("");
    setNotice("");
    try {
      const nextState = await upgradePlayerSlingshot(userId);
      setState(nextState);
      setNotice(`弹弓已升级至 Lv.${nextState.slingshot.level}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "弹弓升级失败");
    } finally {
      setBusyKey(null);
    }
  };

  return {
    state,
    selectedBirdType,
    selectedBird,
    loading,
    busyKey,
    error,
    notice,
    selectBirdType,
    handleUpgradeBird,
    handleAscendBird,
    handleUpgradeSlingshot,
  };
};
