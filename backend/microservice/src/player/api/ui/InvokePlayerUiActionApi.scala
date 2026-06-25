package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.support.ui.PlayerUiRuntimeSupport
import microservice.system.objects.UserRole
import microservice.user.support.AccessControl

/** POST /player/ui/actions/:apiKey 动态 UI 动作 APIMessage。 */
final case class InvokePlayerUiActionAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 调用动态 UI 动作端点执行运行时操作。
    *
    * 关联的前端 API：POST /player/ui/actions/:apiKey；前端 `InvokePlayerUiActionApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player).map(_ => ())
        // 步骤 2：按 apiKey 与 params 执行动态 UI 动作并返回结果
        payload <- PlayerUiRuntimeSupport.requireAction(connection, userId, apiKey, params)
      } yield payload
    }
}
