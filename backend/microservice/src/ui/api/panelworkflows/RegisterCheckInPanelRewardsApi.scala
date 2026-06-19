package microservice.ui.api.panelworkflows

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.CheckInSlotReward
import microservice.player.runtime.PlayerWeeklyCheckInService
import microservice.system.objects.AdminLevel
import microservice.user.utils.AccessControl

/** 总监注册签到面板 7 格奖励 APIMessage。
  *
  * 定义：PUT /admin/director/ui/panel-workflows/:panelId/check-in-rewards。
  * 作用：将 7 格 coins/gems/fragments 写入 PlayerWeeklyCheckInService。
  * 关联：PanelComponent panelRole=checkIn；player 运行时签到逻辑。
  */
final case class RegisterCheckInPanelRewardsAPIMessage(
  userId: String,
  panelId: String,
  slots: Vector[CheckInSlotReward]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** 注册签到面板奖励配置。
    *
    * 实现：requireAdminLevel(Director) → 校验 panelId 与 slots.size==7 → registerPanelRewards。
    * 关联：slots 为 Vector[CheckInSlotReward]；返回 panelId JSON。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 校验总监权限
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director))
        // panelId 非空且 slots 必须恰好 7 格
        _ <- PlanSteps.require(
          if (panelId.trim.isEmpty) {
            Left(HttpError.badRequest("INVALID_PANEL", "panelId is required"))
          } else if (slots.size != 7) {
            Left(HttpError.badRequest("INVALID_SLOTS", "Exactly 7 slot rewards are required"))
          } else {
            Right(())
          }
        )
        // 写入 player 模块签到奖励配置
        _ <- PlanSteps.blocking(PlayerWeeklyCheckInService.registerPanelRewards(connection, panelId, slots))
      } yield Json.obj("panelId" -> Json.fromString(panelId))
    }
}
