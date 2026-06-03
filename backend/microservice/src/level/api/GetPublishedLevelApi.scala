package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.Level
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetPublishedLevelRequest(
  playerId: String,
  levelId: String
)

final case class GetPublishedLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Level] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player)
        .flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).map(RowMappers.toLevel))
    )
}

object GetPublishedLevelEndpoint {
  val name: String = "GetPublishedLevel"
  val method: String = "GET"
  val path: String = "/player/levels/:levelId"
  val businessLogic: String =
    "玩家只能读取已发布关卡；未发布关卡按 not found 处理。"
}
