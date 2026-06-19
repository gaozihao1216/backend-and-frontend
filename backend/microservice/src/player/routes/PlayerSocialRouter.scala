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
import microservice.player.objects.{AddFriendRequest, SendPrivateMessageRequest}
import microservice.system.objects.ApiSuccess
import org.http4s.HttpRoutes
import org.http4s.circe.CirceEntityCodec._
import org.http4s.dsl.io._

/** 玩家社交 HTTP 路由，前缀 /player/social。
  *
  * 定义：friends/messages 四条路由，解析 body/query 并 runAuthenticated。
  * 问题：社交 API 需统一 x-user-id 与 JSON 包装，业务留在 APIMessage。
  * 作用：GET/POST 好友列表与添加；GET/POST 私信线程。
  * 关联：[[AddFriendAPIMessage]] 等；vite proxy /player/social。
  */
object PlayerSocialRouter {
  implicit val addFriendDecoder: Decoder[AddFriendRequest] = deriveDecoder
  implicit val sendMessageDecoder: Decoder[SendPrivateMessageRequest] = deriveDecoder

  def routes(databaseSession: DatabaseSession): HttpRoutes[IO] =
    HttpRoutes.of[IO] {
      // GET /player/social/friends — 当前用户好友列表
      case req @ GET -> Root / "social" / "friends" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        ListFriendsAPIMessage(userId)
          .runAuthenticated(userId, databaseSession)
          .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))

      // POST /player/social/friends — 添加好友（body.friendUserId）
      case req @ POST -> Root / "social" / "friends" =>
        val userId = AuthMiddleware.userIdFromRequest(req).get
        req.as[AddFriendRequest].flatMap { body =>
          AddFriendAPIMessage(userId, body.friendUserId)
            .runAuthenticated(userId, databaseSession)
            .flatMap(result => HttpError.fromEither(result.map(json => ApiSuccess(json))))
        }

      // GET /player/social/messages?withUserId= — 与指定用户的私信记录
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

      // POST /player/social/messages — 发送私信
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
