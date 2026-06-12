package microservice.system.utils

import microservice.level.tables.comment.CommentTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.rating.RatingTable
import microservice.level.tables.submission.SubmissionTable
import microservice.player.runtime.{CheckInSlotReward, PlayerRuntimeDefaults}
import microservice.player.tables.check_in_panel_reward.CheckInPanelRewardTable
import microservice.ui.tables.button_template.ButtonTemplateTable
import microservice.ui.tables.stretch_visual_template.StretchVisualTemplateTable
import java.sql.Connection

/** JDBC 模式演示数据：与 [[SystemSeedData]] / [[SystemDemoData]] 对齐，initialize 后幂等写入。 */
private[utils] object SystemJdbcSeedData {
  def seed(connection: Connection): Unit = {
    val createdAt = SystemDemoData.jdbcDemoTimestamp
    val reviewedAt = createdAt

    SystemDemoData.levels(createdAt).foreach { row =>
      if (LevelTable.findById(connection, row.id).isEmpty) {
        LevelTable.insert(connection, row)
      }
    }

    SystemDemoData.submissions(createdAt, reviewedAt).foreach { row =>
      if (SubmissionTable.findById(connection, row.id).isEmpty) {
        SubmissionTable.insert(connection, row)
      }
    }

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
