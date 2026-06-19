package microservice.system.utils

import microservice.level.tables.comment.CommentTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.rating.RatingTable
import microservice.level.tables.submission.SubmissionTable
import microservice.player.objects.CheckInSlotReward
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable
import microservice.ui.tables.button_template.ButtonTemplateTable
import microservice.ui.tables.stretch_visual_template.StretchVisualTemplateTable
import java.sql.Connection

/** JDBC 模式演示数据：与 in-memory seed 对齐的幂等写入。
  *
  * 定义：private[utils] object，seed(connection) 在表已 initialize 后按 id 去重 insert。
  * 问题：JDBC 冷启动无 InMemoryStore.reset，仍需 level-1 等样例行供联调。
  * 作用：复用 SystemDemoData 行 + UI 模板 + 签到面板奖励，存在则跳过。
  * 关联：[[SystemDefaults.initializeDatabaseOn]] 末尾调用；[[SystemDemoData.jdbcDemoTimestamp]]。
  */
private[utils] object SystemJdbcSeedData {
  /** 幂等 seed：逐表检查 id/唯一键，不存在才 insert。
    *
    * 定义：单 connection 同步 JDBC 写入，无事务包装（由调用方 withTransaction 保证）。
    * 问题：重复 initialize 不应 duplicate key 失败。
    * 作用：填充 levels/submissions/ratings/comments/模板/签到奖励。
    * 关联：各 *Table.findById / listByLevel 去重逻辑。
    */
  def seed(connection: Connection): Unit = {
    val createdAt = SystemDemoData.jdbcDemoTimestamp
    val reviewedAt = createdAt

    // --- 1. 演示关卡 ---
    SystemDemoData.levels(createdAt).foreach { row =>
      if (LevelTable.findById(connection, row.id).isEmpty) {
        LevelTable.insert(connection, row)
      }
    }

    // --- 2. 提交流水 ---
    SystemDemoData.submissions(createdAt, reviewedAt).foreach { row =>
      if (SubmissionTable.findById(connection, row.id).isEmpty) {
        SubmissionTable.insert(connection, row)
      }
    }

    // --- 3. 评分与评论 ---
    SystemDemoData.ratings(createdAt).foreach { row =>
      if (RatingTable.findByLevelAndPlayer(connection, row.levelId, row.playerId).isEmpty) {
        RatingTable.insert(connection, row)
      }
    }

    SystemDemoData.comments(createdAt).foreach { row =>
      val exists =
        CommentTable.listByLevel(connection, row.levelId).exists(_.id == row.id)
      if (!exists) {
        CommentTable.insert(connection, row)
      }
    }

    // --- 4. UI 按钮/拉伸视觉模板（按固定 id 去重）---
    if (ButtonTemplateTable.findById(connection, "btn-demo-primary").isEmpty) {
      SystemUiTemplateSeedData.buttonTemplates(createdAt).foreach { row =>
        ButtonTemplateTable.insert(connection, row)
      }
    }

    if (StretchVisualTemplateTable.findById(connection, "panel-demo-surface").isEmpty) {
      SystemUiTemplateSeedData.stretchVisualTemplates(createdAt).foreach { row =>
        StretchVisualTemplateTable.insert(connection, row)
      }
    }

    // --- 5. 角色主页 7 日签到奖励面板 ---
    CheckInPanelRewardTable.replacePanelRewards(
      connection,
      PlayerRuntimeDefaults.roleHomeCheckInPanelId,
      Vector(
        CheckInSlotReward(10, 0, 0),
        CheckInSlotReward(15, 0, 0),
        CheckInSlotReward(20, 0, 1),
        CheckInSlotReward(30, 0, 0),
        CheckInSlotReward(35, 0, 2),
        CheckInSlotReward(40, 1, 0),
        CheckInSlotReward(50, 2, 5)
      )
    )
  }
}
