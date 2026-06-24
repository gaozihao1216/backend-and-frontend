package microservice.player.support.bootstrap

import java.sql.Connection
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTableInitializer
import microservice.player.tables.preparation.PlayerPreparationTableInitializer
import microservice.player.tables.progress.level_progress.PlayerLevelProgressTableInitializer
import microservice.player.tables.progress.legacy_check_in.PlayerLegacyCheckInTableInitializer
import microservice.player.tables.shop.ShopTableInitializer
import microservice.player.tables.social.{PlayerFriendTableInitializer, PlayerPrivateMessageTableInitializer}
import microservice.player.tables.wallet.PlayerWalletTableInitializer
import microservice.player.tables.weekly_check_in.PlayerWeeklyCheckInTableInitializer

/** player 模块存储初始化入口（供 system 启动编排调用）。 */
private[player] object PlayerStorageBootstrap {
  def initialize(connection: Connection, systemBirdTypes: Vector[String]): Unit = {
    PlayerWalletTableInitializer.initialize(connection)
    PlayerWeeklyCheckInTableInitializer.initialize(connection)
    PlayerLevelProgressTableInitializer.initialize(connection)
    PlayerLegacyCheckInTableInitializer.initialize(connection)
    CheckInPanelRewardTableInitializer.initialize(connection)
    ShopTableInitializer.initialize(connection)
    PlayerFriendTableInitializer.initialize(connection)
    PlayerPrivateMessageTableInitializer.initialize(connection)
    PlayerPreparationTableInitializer.initialize(connection, systemBirdTypes)
  }
}
