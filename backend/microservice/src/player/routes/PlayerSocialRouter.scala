package microservice.player.routes

import cats.effect.IO
import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.{AuthMiddleware, HttpError}
import microservice.player.api.social.{
  AddFriendAPIMessage,
  ListFriendsAPIMessage,
  ListMessagesAPIMessage,
  SendMessageAPIMessage
}
import microservice.player.social.{AddFriendRequest, SendPrivateMessageRequest}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家社交 HTTP 入口，前缀 /player/social。 */
object PlayerSocialRouter {
  implicit val addFriendDecoder: Decoder[AddFriendRequest] = deriveDecoder
  implicit val sendMessageDecoder: Decoder[SendPrivateMessageRequest] = deriveDecoder

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "social" / "friends" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        ListFriendsAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      case req @ POST -> Root / "social" / "friends" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[AddFriendRequest].flatMap { body =>
          AddFriendAPIMessage(userId, body.friendUserId)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
        }

      case req @ GET -> Root / "social" / "messages" :? WithUserIdQueryParamMatcher(withUserId) =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        withUserId match {
          case None =>
            HttpError.toResponse(HttpError.badRequest("INVALID_CHAT_TARGET", "withUserId is required"))
          case Some(chatUserId) =>
            ListMessagesAPIMessage(userId, chatUserId)
              .runAuthenticated(userId, databaseSession)
              .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
        }

      case req @ POST -> Root / "social" / "messages" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[SendPrivateMessageRequest].flatMap { body =>
          SendMessageAPIMessage(userId, body.receiverId, body.content)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
        }
    }

  private object WithUserIdQueryParamMatcher extends OptionalQueryParamDecoderMatcher[String]("withUserId")
}
