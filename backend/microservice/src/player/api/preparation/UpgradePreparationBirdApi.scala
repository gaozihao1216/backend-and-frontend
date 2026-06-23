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

/** POST .../birds/:birdType/upgrade 鸟升级 APIMessage。 */
final case class UpgradePreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        entry <- PlayerPreparationAccess.requireCatalogEntry(connection, birdType)
        _ <- PlanSteps.read(PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType)))
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        currentLevel <- PlanSteps.read(PlayerPreparationTable.listBirdLevels(connection, userId).getOrElse(birdType, 1))
        _ <- PlayerPreparationAccess.requireBirdBelowMaxLevel(currentLevel)
        cost = PlayerPreparationTable.upgradeCost(currentLevel)
        _ <- PlayerPreparationAccess.requireCoins(wallet, cost)
        _ <- PlayerPreparationAccess.requireUpgradeBird(connection, userId, birdType)
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
