package microservice.player.support.bootstrap

import java.sql.Connection
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.progress.level_progress.PlayerLevelProgressTable
import microservice.player.tables.progress.legacy_check_in.PlayerLegacyCheckInTable
import microservice.player.tables.shop.ShopTable
import microservice.player.tables.social.{PlayerFriendTable, PlayerPrivateMessageTable}
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.player.tables.weekly_check_in.PlayerWeeklyCheckInTable

/** player 模块存储初始化入口（供 system 启动编排调用）。 */
object PlayerStorageBootstrap {
  def initialize(connection: Connection, systemBirdTypes: Vector[String]): Unit = {
    PlayerWalletTable.initialize(connection)
    PlayerWeeklyCheckInTable.initialize(connection)
    PlayerLevelProgressTable.initialize(connection)
    PlayerLegacyCheckInTable.initialize(connection)
    CheckInPanelRewardTable.initialize(connection)
    ShopTable.initialize(connection)
    PlayerFriendTable.initialize(connection)
    PlayerPrivateMessageTable.initialize(connection)
    PlayerPreparationTable.initialize(connection, systemBirdTypes)
  }
}
