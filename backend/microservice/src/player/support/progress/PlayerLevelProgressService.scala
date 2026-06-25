package microservice.player.support.progress

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.player.tables.progress.level_progress.PlayerLevelProgressTable

/** 关卡进度 UI 数据服务。
  *
  * 定义：返回已通关 suffix 列表等进度 JSON。
  * 问题：关卡地图 UI 需高亮玩家 cleared 槽位。
  * 作用：listClearedSuffixes → Json 数组。
  * 关联：[[PlayerLevelProgressTable]]；[[GetPlayerUiDataAPIMessage]]。
  */
private[player] object PlayerLevelProgressService {
  private val LevelProgressDataKey = "player.levelProgress"

  private val LevelSuffixes = Vector(
    "level01", "level02", "level03", "level04", "level05",
    "level06", "level07", "level08", "level09", "level10"
  )

  /** 拉取关卡进度状态的 dataSource apiKey。 */
  val dataApiKey: String = LevelProgressDataKey

  /** 返回各关卡 cleared/notCleared/locked 状态与已通关数量。 */
  def requireData(connection: Connection, userId: String): Step[Json] =
    PlanStep.liftF(IO(buildPayload(connection, userId)))

  /** 组装关卡进度 UI JSON：各 suffix 状态与已通关数量。 */
  private def buildPayload(connection: Connection, userId: String): Json = {
    val clearedLevels = PlayerLevelProgressTable.listClearedSuffixes(connection, userId)
    val levelStatuses = LevelSuffixes.map { suffix =>
      suffix -> Json.fromString(resolveStatus(clearedLevels, suffix))
    }.toMap

    Json.obj(
      "levels" -> Json.obj(levelStatuses.toSeq: _*),
      "clearedCount" -> Json.fromInt(clearedLevels.size)
    )
  }

  /** 单关状态：cleared / notCleared（已解锁未通）/ locked。 */
  private def resolveStatus(clearedLevels: Set[String], suffix: String): String = {
    if (clearedLevels.contains(suffix)) {
      "cleared"
    } else if (isUnlocked(clearedLevels, suffix)) {
      "notCleared"
    } else {
      "locked"
    }
  }

  /** 首关恒解锁；其余关需前一 suffix 已通关。 */
  private def isUnlocked(clearedLevels: Set[String], suffix: String): Boolean = {
    val index = LevelSuffixes.indexOf(suffix)
    if (index <= 0) {
      true
    } else {
      clearedLevels.contains(LevelSuffixes(index - 1))
    }
  }
}
