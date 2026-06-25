import type { DirectorPanelCreateViewModel } from "../.././hooks/useDirectorPanelCreate.js";
import { PanelCreateChildOutline, renderButtonPreviewContent, renderButtonPreviewLayers, renderPanelBackgroundLayer } from "./panel-create-preview.js";
import { resolvePanelDecoration } from "../../../../../lib/director-template-select.js";
import {
  getPanelTextArtContainerClassName,
  getPanelTextArtContainerStyle,
  getPanelTextArtContentClassName,
  getPanelTextArtContentStyle,
  getTextArtAccentColor,
  getTextArtAccentHint,
  getTextArtAccentLabel,
  getTextArtGradientDirection,
  getTextArtGradientIntensity,
  isArtTextPreset,
  patchTextArtDesign,
  TEXT_ART_GRADIENT_DIRECTION_OPTIONS,
  TEXT_ART_GRADIENT_INTENSITY_OPTIONS,
  TEXT_ART_PRESET_OPTIONS,
  resolveTextArtDesign,
  usesTextArtGradient,
} from "../../../../../lib/art-text-styles.js";
import { clamp, getDecorationStyle, getPanelRenderedAspectRatio } from "../../../../../lib/director-page/panel-create-helpers.js";
import { getButtonStateContentType } from "../../../../../lib/director-page/panel-create-helpers.js";
import { defaultWeeklyCheckInRewards } from "../../../../../lib/weekly-check-in-panel.js";
import { pagePreviewAspectRatio } from "../../../../../objects/director-page/panel-create-types.js";

type StepProps = { vm: DirectorPanelCreateViewModel };

export const PanelCreateRewardConfigStep = ({ vm }: StepProps) => {
  const {
    step,
    weeklyCheckInRewards,
    updateWeeklyCheckInReward,
    WEEKLY_CHECK_IN_DAY_COUNT
  } = vm;

  return (
            <section className="panel-create-form panel-create-reward-config">
              <h3>每周签到奖励配置</h3>
              <p className="meta">
                签到规则（例如本周已签 3 次、今天未签，则第 4 个按钮可领）由系统自动判定，不需要在这里可视化编辑。
                你只需配置每个按钮领取时增加到玩家账户的金币、钻石、碎片。
              </p>
              <div className="panel-create-reward-table-wrap">
                <table className="panel-create-reward-table">
                  <thead>
                    <tr>
                      <th>签到按钮</th>
                      <th>金币</th>
                      <th>钻石</th>
                      <th>碎片</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: WEEKLY_CHECK_IN_DAY_COUNT }, (_, index) => {
                      const dayIndex = index + 1;
                      const reward = weeklyCheckInRewards[index] ?? defaultWeeklyCheckInRewards()[index]!;
                      return (
                        <tr key={dayIndex}>
                          <th scope="row">第 {dayIndex} 天</th>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={reward.coins}
                              onChange={(event) => updateWeeklyCheckInReward(dayIndex, "coins", Number(event.target.value))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={reward.gems}
                              onChange={(event) => updateWeeklyCheckInReward(dayIndex, "gems", Number(event.target.value))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={reward.fragments}
                              onChange={(event) => updateWeeklyCheckInReward(dayIndex, "fragments", Number(event.target.value))}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="meta panel-create-reward-footnote">
                示例：玩家本周已签到 3 次且今天还没签，则第 4 个按钮变为可领取；点击后会按上表奖励增加玩家资产，并切换到已领取状态。
              </p>
            </section>
  );
};
