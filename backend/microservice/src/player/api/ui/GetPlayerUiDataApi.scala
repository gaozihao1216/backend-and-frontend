package microservice.player.api.ui

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.runtime.{
  PlayerLevelProgressService,
  PlayerShopService,
  PlayerWalletService,
  PlayerWeeklyCheckInService
}
import microservice.player.tables.progress.PlayerLegacyCheckInTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** GET /player/ui/data/:apiKey — 按 apiKey 拉取动态页面运行时数据。 */
final case class GetPlayerUiDataAPIMessage(
  userId: String,
  apiKey: String,
  params: Map[String, String]
) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player).map(_ => ()))
        payload <- apiKey match {
          case PlayerWeeklyCheckInService.dataApiKey =>
            PlanSteps.require(PlayerWeeklyCheckInService.getData(connection, userId))
          case PlayerLevelProgressService.dataApiKey =>
            PlanSteps.require(PlayerLevelProgressService.getData(connection, userId))
          case PlayerWalletService.dataApiKey =>
            PlanSteps.require(PlayerWalletService.getData(connection, userId))
          case PlayerShopService.dataApiKey =>
            PlanSteps.require(PlayerShopService.getData(connection, userId, params))
          case GetPlayerUiDataAPIMessage.LegacyCheckInDataKey =>
            PlanSteps.read(
              Json.obj("status" -> Json.fromString(PlayerLegacyCheckInTable.getStatus(connection, userId)))
            )
          case other =>
            PlanSteps.require[Json](Left(HttpError.notFound("UNKNOWN_UI_DATA_KEY", s"Unknown ui data key: $other")))
        }
      } yield payload
    }
}

object GetPlayerUiDataAPIMessage {
  private val LegacyCheckInDataKey = "player.checkIn"
}
