package microservice.player.api.social

import cats.data.EitherT
import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanStep, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.social.{PlayerMessageListResponse, PlayerPrivateMessageView, PlayerSocialJson}
import microservice.player.tables.social.PlayerFriendTable
import microservice.player.tables.social.PlayerPrivateMessageTable
import microservice.system.objects.enums.UserRole
import microservice.user.support.AccessControl

/** 私信列表 APIMessage。
  *
  * 定义：userId + withUserId 查询双方会话历史。
  * 问题：仅好友可互发私信，需防未授权窥视聊天记录。
  * 作用：校验好友关系 → listConversation → 标记 mine 字段。
  * 关联：[[microservice.player.routes.PlayerApiMessages]] 注册；[[PlayerPrivateMessageTable]]。
  */
final case class ListMessagesAPIMessage(userId: String, withUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 查询与指定好友的私信会话历史。
    *
    * 关联的前端 API：`ListMessagesApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：校验 withUserId 非空且非自己
        _ <- requireValidChatTarget
        // 步骤 3：确认双方为好友关系
        _ <- requireFriendship(connection)
        // 步骤 4：读取会话消息并标记 mine 字段
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

  private def requireValidChatTarget: PlanStep.Step[Unit] =
    if (withUserId.trim.isEmpty) {
      PlanStep.fail(HttpError.badRequest("INVALID_CHAT_TARGET", "withUserId is required"))
    } else {
      PlanStep.succeed(())
    }

  private def requireFriendship(connection: Connection): PlanStep.Step[Unit] =
    EitherT.liftF(IO(PlayerFriendTable.exists(connection, userId, withUserId))).flatMap {
      case false => EitherT.leftT[IO, Unit](HttpError.forbidden("You can only chat with friends"))
      case true  => EitherT.rightT[IO, HttpError](())
    }
}
