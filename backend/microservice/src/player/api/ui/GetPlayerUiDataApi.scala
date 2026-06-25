package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.support.ui.PlayerUiRuntimeSupport
import microservice.system.objects.enums.UserRole
import microservice.user.support.AccessControl

/** GET /player/ui/data/:apiKey 动态 UI 数据 APIMessage。 */
final case class GetPlayerUiDataAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 调用动态 UI 数据端点获取运行时 JSON 载荷。
    *
    * 关联的前端 API：GET /player/ui/data/:apiKey；前端 `GetPlayerUiDataApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player).map(_ => ())
        // 步骤 2：按 apiKey 与 params 解析并返回动态 UI 数据
        payload <- PlanSteps.fromEither(PlayerUiRuntimeSupport.requireData(connection, userId, apiKey, params))
      } yield payload
    }
}
