package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{CheckInSlotReward, PlayerPreparationJson}
import microservice.player.preparation.PlayerPreparationSupport
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** GET /player/preparation — 获取当前用户全部鸟与弹弓备战状态。 */
final case class GetPreparationStateAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, wallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
