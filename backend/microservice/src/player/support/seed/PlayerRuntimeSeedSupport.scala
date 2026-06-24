package microservice.player.support.seed

import java.sql.Connection
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable

/** 玩家运行时种子（player 模块内）。 */
private[player] object PlayerRuntimeSeedSupport {
  def seedCheckInPanelIfEmpty(connection: Connection): Unit =
    CheckInPanelRewardTable.replacePanelRewards(
      connection,
      PlayerRuntimeDefaults.roleHomeCheckInPanelId,
      DemoCheckInRewardsFactory.roleHomePanelRewards
    )
}
