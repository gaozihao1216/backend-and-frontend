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

/** POST .../slingshot/upgrade 弹弓升级 APIMessage。 */
final case class UpgradePreparationSlingshotAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        currentLevel <- PlanSteps.read(PlayerPreparationTable.getSlingshotLevel(connection, userId))
        _ <- PlayerPreparationAccess.requireSlingshotBelowMaxLevel(currentLevel)
        cost = PlayerPreparationTable.upgradeCost(currentLevel)
        _ <- PlayerPreparationAccess.requireCoins(wallet, cost)
        _ <- PlayerPreparationAccess.requireUpgradeSlingshot(connection, userId)
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
