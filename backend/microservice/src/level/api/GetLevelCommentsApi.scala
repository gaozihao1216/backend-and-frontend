package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.LevelComment
import microservice.level.tables.CommentTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetLevelCommentsRequest(
  playerId: String,
  levelId: String
)

final case class GetLevelCommentsAPIMessage(
  token: String,
  levelId: String
) extends APIWithTokenMessage[List[LevelComment]] {
  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    IO.pure(
      AccessControl.requireRole(token, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(levelId).map(_ =>
        CommentTable.all
          .filter(_.levelId == levelId)
          .sortBy(_.createdAt)(Ordering[String].reverse)
          .map(RowMappers.toComment)
          .toList
      ))
    )
}

object GetLevelCommentsEndpoint {
  val name: String = "GetLevelComments"
  val method: String = "GET"
  val path: String = "/player/levels/:levelId/comments"
  val businessLogic: String =
    "返回已发布关卡的评论，按创建时间倒序排列。"
}
