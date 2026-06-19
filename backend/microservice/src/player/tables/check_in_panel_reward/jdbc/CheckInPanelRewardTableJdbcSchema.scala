/**
  *
   * 定义：CheckInPanelRewardTableJdbcSchema：PostgreSQL DDL 与迁移/种子 SQL。
 * 问题：JDBC 模式冷启动需建表且与 in-memory 演示数据 id 对齐。
 * 作用：initialize(connection) 执行 CREATE TABLE / ALTER / INSERT ON CONFLICT。
 * 关联：[[CheckInPanelRewardTableTable]] initialize 调用；docker init-store.sql 可对齐。
 */
package microservice.player.tables.check_in_panel_reward.jdbc

import microservice.player.tables.check_in_panel_reward._

import microservice.player.objects.CheckInSlotReward
import java.sql.Connection

private[tables] object CheckInPanelRewardTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS check_in_panel_rewards (
            panel_id TEXT NOT NULL,
            slot_index INTEGER NOT NULL,
            coins INTEGER NOT NULL DEFAULT 0,
            gems INTEGER NOT NULL DEFAULT 0,
            fragments INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (panel_id, slot_index)
          )
        """
      )
      seedDefaultRewards(statement)
    } finally {
      statement.close()
    }
  }

  private def seedDefaultRewards(statement: java.sql.Statement): Unit = {
    val panelId = "player.home.checkIn"
    val rewards = Vector(
      (1, 10, 0, 0),
      (2, 15, 0, 0),
      (3, 20, 0, 1),
      (4, 30, 0, 0),
      (5, 35, 0, 2),
      (6, 40, 1, 0),
      (7, 50, 2, 5)
    )
    rewards.foreach { case (slot, coins, gems, fragments) =>
      statement.executeUpdate(
        s"""
          INSERT INTO check_in_panel_rewards (panel_id, slot_index, coins, gems, fragments)
          VALUES ('$panelId', $slot, $coins, $gems, $fragments)
          ON CONFLICT (panel_id, slot_index) DO NOTHING
        """
      )
    }
  }
}
