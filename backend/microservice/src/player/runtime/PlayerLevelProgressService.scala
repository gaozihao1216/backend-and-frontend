package microservice.player.runtime

import microservice.infrastructure.http.HttpError
import microservice.player.tables.progress.PlayerLevelProgressTable
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection

/** 玩家关卡进度运行时服务：为关卡地图页提供各关卡解锁/通关状态。
  *
  * 实现：固定 10 个 level 后缀，首关默认解锁，通关前一关解锁下一关。
  * 关联：PlayerLevelProgressTable；前端 level-map 页面 dataSource 消费。
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
