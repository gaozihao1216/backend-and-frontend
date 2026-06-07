package microservice.player.runtime

import microservice.infrastructure.database.InMemoryStore
import microservice.infrastructure.http.HttpError
import io.circe.Json
import io.circe.syntax._

object PlayerLevelProgressService {
  private val LevelProgressDataKey = "player.levelProgress"

  private val LevelSuffixes = Vector(
    "level01", "level02", "level03", "level04", "level05",
    "level06", "level07", "level08", "level09", "level10"
  )

  val dataApiKey: String = LevelProgressDataKey

  def getData(userId: String): Either[HttpError, Json] =
    Right(buildPayload(userId))

  private def buildPayload(userId: String): Json = {
    val clearedLevels = currentClearedLevels(userId)
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

  private def currentClearedLevels(userId: String): Set[String] =
    InMemoryStore.playerLevelProgress.getOrElse(userId, Set("level01"))
}
