package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{PlayerMessageListResponse, PlayerPrivateMessageView, PlayerSocialJson}
import microservice.player.support.social.PlayerSocialAccess
import microservice.player.tables.social.PlayerPrivateMessageTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** GET /player/social/messages 私信列表 APIMessage。
  *
  * 定义：userId + withUserId 查询双方会话历史。
  * 问题：仅好友可互发私信，需防未授权窥视聊天记录。
  * 作用：校验好友关系 → listConversation → 标记 mine 字段。
  * 关联：[[PlayerSocialRouter]] ?withUserId=；[[PlayerPrivateMessageTable]]。
  */
final case class ListMessagesAPIMessage(userId: String, withUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        _ <- PlayerSocialAccess.requireValidChatTarget(withUserId)
        _ <- PlayerSocialAccess.requireFriendship(connection, userId, withUserId)
        messages <- PlanSteps.read(
          PlayerPrivateMessageTable
            .listConversation(connection, userId, withUserId)
            .map { row =>
              PlayerPrivateMessageView(
                id = row.id,
                senderId = row.senderId,
                receiverId = row.receiverId,
                content = row.content,
                createdAt = row.createdAt,
                mine = row.senderId == userId
              )
            }
            .toList
        )
      } yield PlayerSocialJson.toJsonMessages(PlayerMessageListResponse(messages))
    }
}
