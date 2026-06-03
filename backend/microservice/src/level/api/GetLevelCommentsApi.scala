package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.LevelComment
import microservice.level.tables.CommentTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetLevelCommentsAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player)
        .flatMap(_ =>
          LevelApiSupport.publishedLevel(connection, levelId).map(_ =>
            CommentTable.listByLevel(connection, levelId).map(RowMappers.toComment).toList
          )
        )
    )
}

object GetLevelCommentsEndpoint {
  val name: String = "GetLevelComments"
  val method: String = "GET"
  val path: String = "/player/levels/:levelId/comments"
  val businessLogic: String =
    "返回已发布关卡的评论，按创建时间倒序排列。"
}
