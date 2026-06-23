package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.{PlayerPreparationAccess, PlayerPreparationSupport}
import microservice.player.objects.PlayerPreparationJson
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST .../birds/:birdType/ascend 鸟升阶 APIMessage。 */
final case class AscendPreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        entry <- PlayerPreparationAccess.requireCatalogEntry(connection, birdType)
        _ <- PlanSteps.read(PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType)))
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        currentTier <- PlanSteps.read(PlayerPreparationTable.listBirdTiers(connection, userId).getOrElse(birdType, 1))
        _ <- PlayerPreparationAccess.requireBirdBelowMaxTier(currentTier)
        cost = PlayerPreparationTable.ascendCost(currentTier)
        _ <- PlayerPreparationAccess.requireFragments(wallet, cost)
        _ <- PlayerPreparationAccess.requireAscendBird(connection, userId, birdType)
        updatedWallet = wallet.copy(fragments = wallet.fragments - cost)
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
