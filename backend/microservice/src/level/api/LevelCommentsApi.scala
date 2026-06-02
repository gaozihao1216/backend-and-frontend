package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class GetLevelCommentsRequest(
  playerId: String,
  levelId: String
)

final case class CreateCommentBody(
  content: String
)

object CreateCommentBody {
  implicit val encoder: Encoder[CreateCommentBody] = deriveEncoder
  implicit val decoder: Decoder[CreateCommentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateCommentBody] = jsonOf
}

final case class CreateCommentRequest(
  playerId: String,
  levelId: String,
  content: String
)

object GetLevelCommentsEndpoint {
  val name: String = "GetLevelComments"
  val method: String = "GET"
  val path: String = "/player/levels/:levelId/comments"
  val businessLogic: String =
    "返回已发布关卡的评论，按创建时间倒序排列。"
}

object CreateCommentEndpoint {
  val name: String = "CreateComment"
  val method: String = "POST"
  val path: String = "/player/levels/:levelId/comments"
  val businessLogic: String =
    "玩家只能给已发布关卡创建评论。"
}
