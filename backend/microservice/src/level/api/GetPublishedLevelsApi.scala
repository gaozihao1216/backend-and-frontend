package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.Level
import microservice.level.tables.LevelTable
import microservice.system.objects.LevelTag
import microservice.system.objects.UserRole

final case class GetPublishedLevelsRequest(
  playerId: String,
  tag: Option[LevelTag],
  sort: String
)

final case class GetPublishedLevelsAPIMessage(
  playerId: String,
  tag: Option[LevelTag],
  sort: String
) extends APIWithTokenMessage[List[Level]] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, List[Level]]] =
    IO.pure {
      AccessControl.requireRole(connection, playerId, UserRole.Player).map { _ =>
        LevelTable.listPublished(connection, tag, sort).map(RowMappers.toLevel).toList
      }
    }
}

object GetPublishedLevelsEndpoint {
  val name: String = "GetPublishedLevels"
  val method: String = "GET"
  val path: String = "/player/levels"
  val businessLogic: String =
    "返回 published 关卡列表，支持按 tag 过滤，并按 newest/highestRated/mostRated 排序。"
}
