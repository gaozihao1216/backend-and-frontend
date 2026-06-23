package microservice.player.api.social

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{PlayerMessageListResponse, PlayerPrivateMessageView, PlayerSocialJson}
import microservice.player.support.social.PlayerSocialAccess
import microservice.player.tables.social.{PlayerPrivateMessageRow, PlayerPrivateMessageTable}
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST /player/social/messages 发送私信 APIMessage。
  *
  * 定义：userId + receiverId + content，插入后返回完整会话。
  * 问题：空内容或非好友发送应拒绝；发送后 UI 需刷新线程。
  * 作用：校验 → insert 新 Row → listConversation 返回更新列表。
  * 关联：[[PlayerSocialRouter]] POST；[[PlayerPrivateMessageRow]]。
  */
final case class SendMessageAPIMessage(userId: String, receiverId: String, content: String)
    extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        trimmed <- PlayerSocialAccess.requireValidMessage(receiverId, content)
        _ <- PlayerSocialAccess.requireFriendship(connection, userId, receiverId)
        _ <- PlanSteps.read(
          PlayerPrivateMessageTable.insert(
            connection,
            PlayerPrivateMessageRow(
              id = PlayerPrivateMessageTable.nextId(connection),
              senderId = userId,
              receiverId = receiverId,
              content = trimmed,
              createdAt = Instant.now().toString
            )
          )
        )
        messages <- PlanSteps.read(
          PlayerPrivateMessageTable
            .listConversation(connection, userId, receiverId)
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
