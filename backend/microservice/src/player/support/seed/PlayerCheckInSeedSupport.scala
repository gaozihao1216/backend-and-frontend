package microservice.player.support.seed

import java.sql.Connection
import microservice.player.support.checkin.PlayerCheckInDefaults
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable

/** 玩家签到种子数据（player 模块内）。 */
private[player] object PlayerCheckInSeedSupport {
  def seedCheckInPanelIfEmpty(connection: Connection): Unit =
    CheckInPanelRewardTable.replacePanelRewards(
      connection,
      PlayerCheckInDefaults.roleHomeCheckInPanelId,
      DemoCheckInRewardsFactory.roleHomePanelRewards
    )
}
