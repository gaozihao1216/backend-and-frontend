package microservice.system.utils

import cats.effect.IO
import java.time.Instant
import microservice.auth.tables.user.UserTable
import microservice.infrastructure.database.{DatabaseConfig, DatabaseSession}
import microservice.bird.tables.design.{BirdDesignTable}
import microservice.bird.tables.skill_config.{BirdSkillConfigTable}
import microservice.bird.tables.submission.{BirdSubmissionTable}
import microservice.level.tables.comment.{CommentTable}
import microservice.level.tables.favorite.{FavoriteTable}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.rating.{RatingTable}
import microservice.level.tables.slot_assignment.{LevelSlotAssignmentTable}
import microservice.level.tables.submission.{SubmissionTable}
import microservice.player.tables.check_in_panel_reward.{CheckInPanelRewardTable}
import microservice.player.tables.preparation.{PlayerPreparationTable}
import microservice.player.tables.progress.{PlayerLegacyCheckInTable, PlayerLevelProgressTable}
import microservice.player.tables.shop.{ShopTable}
import microservice.player.tables.social.{PlayerFriendTable, PlayerPrivateMessageTable}
import microservice.player.tables.wallet.{PlayerWalletTable}
import microservice.player.tables.weekly_check_in.{PlayerWeeklyCheckInTable}
import microservice.routes.ApiRouter
import microservice.ui.tables.button_template.{ButtonTemplateTable}
import microservice.ui.tables.stretch_visual_template.{StretchVisualTemplateTable}
import microservice.ui.tables.ui_page.{UiPageTable}
import org.http4s.HttpRoutes

/** 应用级默认装配：数据库会话、种子数据、HTTP 路由树。
  *
  * 实现：
  *   - 读取 UGC_DATABASE_* 环境变量选择 in-memory 或 JDBC。
  *   - 启动时调用 SystemSeedData 填充 InMemoryStore（演示账号与样例关卡）。
  *   - initializeDatabase 在 JDBC 模式下执行各 Table.initialize 建表。
  * 关联：Main 启动入口；ApiRouter 消费 databaseSession。
  */
object SystemDefaults {
  val databaseConfig: DatabaseConfig =
    DatabaseConfig(
      driver = sys.env.getOrElse("UGC_DATABASE_DRIVER", "org.postgresql.Driver"),
      url = sys.env.getOrElse("UGC_DATABASE_URL", "jdbc:postgresql://localhost:5432/ugc_level_platform"),
      schema = sys.env.getOrElse("UGC_DATABASE_SCHEMA", "public"),
      username = sys.env.get("UGC_DATABASE_USERNAME"),
      password = sys.env.get("UGC_DATABASE_PASSWORD")
    )

  val databaseSession: DatabaseSession =
    // 显式 UGC_DATABASE_MODE=in_memory 时用内存；否则走 JDBC（需 PostgreSQL 可用）
    sys.env.get("UGC_DATABASE_MODE") match {
      case Some("in_memory") => DatabaseSession.inMemory(databaseConfig)
      case _ => DatabaseSession.jdbc(databaseConfig)
    }

  private val createdAt = Instant.now().toString
  private val reviewedAt = createdAt

  // 进程加载时注入演示用户、关卡、模板等；与 frontend 绑定账号 ID 对应
  SystemSeedData.reset(createdAt, reviewedAt)

  def apiRoutes: HttpRoutes[cats.effect.IO] =
    ApiRouter.routes(databaseSession = databaseSession)

  /** 启动阶段调用：JDBC 模式下为各业务表执行 DDL/迁移；in-memory 模式下多为 no-op。 */
  def initializeDatabase: IO[Unit] =
    databaseSession.withTransaction { connection =>
      IO.blocking {
        UserTable.initialize(connection)
        LevelTable.initialize(connection)
        SubmissionTable.initialize(connection)
        LevelSlotAssignmentTable.initialize(connection)
        RatingTable.initialize(connection)
        CommentTable.initialize(connection)
        FavoriteTable.initialize(connection)
        UiPageTable.initialize(connection)
        ButtonTemplateTable.initialize(connection)
        StretchVisualTemplateTable.initialize(connection)
        PlayerWalletTable.initialize(connection)
        PlayerWeeklyCheckInTable.initialize(connection)
        PlayerLevelProgressTable.initialize(connection)
        PlayerLegacyCheckInTable.initialize(connection)
        CheckInPanelRewardTable.initialize(connection)
        ShopTable.initialize(connection)
        BirdDesignTable.initialize(connection)
        BirdSubmissionTable.initialize(connection)
        BirdSkillConfigTable.initialize(connection)
        PlayerFriendTable.initialize(connection)
        PlayerPrivateMessageTable.initialize(connection)
        PlayerPreparationTable.initialize(connection)
      }
    }
}
