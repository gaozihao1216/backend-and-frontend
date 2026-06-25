package microservice.ui.api.panelworkflows

import cats.effect.IO
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.api.internal.ui.RegisterCheckInPanelRewardsInternalAPIMessage
import microservice.system.objects.enums.AdminLevel
import microservice.ui.objects.panelworkflows.UiCheckInSlotReward
import microservice.ui.support.mapping.PlayerHandoffMapping
import microservice.user.support.AccessControl

/** 总监注册签到面板 7 格奖励 APIMessage。 */
final case class RegisterCheckInPanelRewardsAPIMessage(
  userId: String,
  panelId: String,
  slots: Vector[UiCheckInSlotReward]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director).map(_ => ())
        _ <- PlanSteps.runApi(
          RegisterCheckInPanelRewardsInternalAPIMessage(
            panelId,
            PlayerHandoffMapping.toCheckInSlotRewards(slots)
          ),
          connection
        )
      } yield Json.obj("panelId" -> Json.fromString(panelId))
    }
}
