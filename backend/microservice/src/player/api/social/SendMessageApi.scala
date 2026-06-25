package microservice.player.api.social

import cats.data.EitherT
import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage, PlanStep, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.social.{PlayerMessageListResponse, PlayerPrivateMessageView, PlayerSocialJson}
import microservice.player.tables.social.PlayerFriendTable
import microservice.player.tables.social.{PlayerPrivateMessageRow, PlayerPrivateMessageTable}
import microservice.system.objects.enums.UserRole
import microservice.user.support.AccessControl

/** 发送私信 APIMessage。
  *
  * 定义：userId + receiverId + content，插入后返回完整会话。
  * 问题：空内容或非好友发送应拒绝；发送后 UI 需刷新线程。
  * 作用：校验 → insert 新 Row → listConversation 返回更新列表。
  * 关联：[[microservice.player.routes.PlayerApiMessages]] 注册；[[PlayerPrivateMessageRow]]。
  */
final case class SendMessageAPIMessage(userId: String, receiverId: String, content: String)
    extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 向好友发送私信并返回更新后的会话列表。
    *
    * 关联的前端 API：`SendMessageApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：校验消息内容与 receiverId 合法性
        trimmed <- requireValidMessage
        // 步骤 3：确认双方为好友关系
        _ <- requireFriendship(connection)
        // 步骤 4：插入新私信记录
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
        // 步骤 5：重查会话消息并标记 mine 字段
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

  private def requireValidMessage: PlanStep.Step[String] = {
    val trimmed = content.trim
    if (receiverId.trim.isEmpty || trimmed.isEmpty) {
      PlanStep.fail(HttpError.badRequest("INVALID_MESSAGE", "receiverId and content are required"))
    } else {
      PlanStep.succeed(trimmed)
    }
  }

  private def requireFriendship(connection: Connection): PlanStep.Step[Unit] =
    EitherT.liftF(IO(PlayerFriendTable.exists(connection, userId, receiverId))).flatMap {
      case false => EitherT.leftT[IO, Unit](HttpError.forbidden("You can only chat with friends"))
      case true  => EitherT.rightT[IO, HttpError](())
    }
}
