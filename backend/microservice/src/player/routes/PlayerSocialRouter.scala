package microservice.player.routes

import cats.effect.IO
import io.circe.Decoder
import io.circe.generic.semiauto._
import microservice.infrastructure.database.DatabaseSession
import microservice.infrastructure.http.HttpError
import microservice.level.routes.PlayerLevelRouteSupport
import microservice.player.social.{AddFriendRequest, PlayerSocialService, SendPrivateMessageRequest}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

object PlayerSocialRouter {
  implicit val addFriendDecoder: Decoder[AddFriendRequest] = deriveDecoder
  implicit val sendMessageDecoder: Decoder[SendPrivateMessageRequest] = deriveDecoder

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "social" / "friends" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            databaseSession.withTransaction { connection =>
              IO.pure(PlayerSocialService.listFriends(connection, userId))
                .flatMap { result =>
                  HttpError.fromEither(result.map(response => ApiSuccess(PlayerSocialService.toJsonFriends(response))))
                }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "social" / "friends" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            req.as[AddFriendRequest].flatMap { body =>
              databaseSession.withTransaction { connection =>
                IO.pure(PlayerSocialService.addFriend(connection, userId, body.friendUserId))
                  .flatMap { result =>
                    HttpError.fromEither(result.map(response => ApiSuccess(PlayerSocialService.toJsonFriends(response))))
                  }
              }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ GET -> Root / "social" / "messages" :? WithUserIdQueryParamMatcher(withUserId) =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            withUserId match {
              case None =>
                HttpError.toResponse(HttpError.badRequest("INVALID_CHAT_TARGET", "withUserId is required"))
              case Some(chatUserId) =>
                databaseSession.withTransaction { connection =>
                  IO.pure(PlayerSocialService.listMessages(connection, userId, chatUserId))
                    .flatMap { result =>
                      HttpError.fromEither(result.map(response => ApiSuccess(PlayerSocialService.toJsonMessages(response))))
                    }
                }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }

      case req @ POST -> Root / "social" / "messages" =>
        PlayerLevelRouteSupport.currentUserId(req) match {
          case Some(userId) =>
            req.as[SendPrivateMessageRequest].flatMap { body =>
              databaseSession.withTransaction { connection =>
                IO.pure(PlayerSocialService.sendMessage(connection, userId, body.receiverId, body.content))
                  .flatMap { result =>
                    HttpError.fromEither(result.map(response => ApiSuccess(PlayerSocialService.toJsonMessages(response))))
                  }
              }
            }
          case None =>
            HttpError.toResponse(HttpError.unauthorized("Missing x-user-id header"))
        }
    }

  private object WithUserIdQueryParamMatcher extends OptionalQueryParamDecoderMatcher[String]("withUserId")
}
