package microservice.level.utils

import microservice.infrastructure.http.HttpError
import microservice.level.tables.{LevelRow, LevelTable}
import microservice.system.objects.LevelStatus
import java.sql.Connection

object LevelApiSupport {
  def publishedLevel(connection: Connection, levelId: String): Either[HttpError, LevelRow] =
    LevelTable.findById(connection, levelId) match {
      case Some(level) if level.status == LevelStatus.Published => Right(level)
      case Some(_) => Left(HttpError.notFound("LEVEL_NOT_FOUND", "Published level not found"))
      case None => Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
    }
}
