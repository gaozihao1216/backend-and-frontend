package microservice.player.runtime

import microservice.infrastructure.http.HttpError
import microservice.player.tables.PlayerLevelProgressTable
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection

object PlayerLevelProgressService {
  private val LevelProgressDataKey = "player.levelProgress"

  private val LevelSuffixes = Vector(
    "level01", "level02", "level03", "level04", "level05",
    "level06", "level07", "level08", "level09", "level10"
  )

  val dataApiKey: String = LevelProgressDataKey

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
