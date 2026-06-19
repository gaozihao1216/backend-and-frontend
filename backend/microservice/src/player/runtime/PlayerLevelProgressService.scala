package microservice.player.runtime

import microservice.infrastructure.http.HttpError
import microservice.player.tables.progress.PlayerLevelProgressTable
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection

/** 关卡进度 UI 数据服务。
  *
  * 定义：返回已通关 suffix 列表等进度 JSON。
  * 问题：关卡地图 UI 需高亮玩家 cleared 槽位。
  * 作用：listClearedSuffixes → Json 数组。
  * 关联：[[PlayerProgressTable]]；[[GetPlayerUiDataAPIMessage]]。
  */
object PlayerLevelProgressService {
  private val LevelProgressDataKey = "player.levelProgress"

  private val LevelSuffixes = Vector(
    "level01", "level02", "level03", "level04", "level05",
    "level06", "level07", "level08", "level09", "level10"
  )

  /** 拉取关卡进度状态的 dataSource apiKey。 */
  val dataApiKey: String = LevelProgressDataKey

  /** 返回各关卡 cleared/notCleared/locked 状态与已通关数量。 */
  def getData(connection: Connection, userId: String): Either[HttpError, Json] =
    Right(buildPayload(connection, userId))

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

  private def resolveStatus(clearedLevels: Set[String], suffix: String): String = {
    if (clearedLevels.contains(suffix)) {
      "cleared"
    } else if (isUnlocked(clearedLevels, suffix)) {
      "notCleared"
    } else {
      "locked"
    }
  }

  private def isUnlocked(clearedLevels: Set[String], suffix: String): Boolean = {
    val index = LevelSuffixes.indexOf(suffix)
    if (index <= 0) {
      true
    } else {
      clearedLevels.contains(LevelSuffixes(index - 1))
    }
  }
}
