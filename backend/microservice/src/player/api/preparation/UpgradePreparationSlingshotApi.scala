package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.{CheckInSlotReward, PlayerPreparationJson}
import microservice.player.preparation.PlayerPreparationSupport
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST /player/preparation/slingshot/upgrade — 消耗金币提升弹弓等级。 */
final case class UpgradePreparationSlingshotAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        currentLevel <- PlanSteps.read(PlayerPreparationTable.getSlingshotLevel(connection, userId))
        _ <- PlanSteps.require(
          if (currentLevel >= PlayerPreparationTable.maxLevel) {
            Left(HttpError.conflict("MAX_LEVEL", "Slingshot is already at max level"))
          } else {
            Right(())
          }
        )
        cost = PlayerPreparationTable.upgradeCost(currentLevel)
        _ <- PlanSteps.require(
          if (wallet.coins < cost) {
            Left(HttpError.conflict("INSUFFICIENT_COINS", s"Need $cost coins to upgrade"))
          } else {
            Right(())
          }
        )
        _ <- PlanSteps.require(
          PlayerPreparationTable.upgradeSlingshot(connection, userId) match {
            case Left(message) => Left(HttpError.badRequest("INVALID_SLINGSHOT", message))
            case Right(_)      => Right(())
          }
        )
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
