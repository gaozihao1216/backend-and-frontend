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

/** 玩家社交 HTTP 入口，前缀 /player/social。
  *
  * 实现：好友列表、加好友、私信列表与发送；均要求 x-user-id，私信仅限好友间。
  * 关联：frontend 社交面板；数据存 player_friends / player_private_messages 表。
  */
object PlayerSocialRouter {
  implicit val addFriendDecoder: Decoder[AddFriendRequest] = deriveDecoder
  implicit val sendMessageDecoder: Decoder[SendPrivateMessageRequest] = deriveDecoder

  /** 注册 /player/social 下的路由；业务逻辑委托 PlayerSocialService。 */
  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /player/social/friends — 列出当前用户的好友摘要
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

      // POST /player/social/friends — 添加好友（双向写入好友关系）
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

      // GET /player/social/messages?withUserId= — 与指定好友的私信记录
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

      // POST /player/social/messages — 向好友发送私信
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
