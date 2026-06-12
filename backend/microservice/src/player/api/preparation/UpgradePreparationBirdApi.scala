package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.{PlayerPreparationCatalog, PlayerPreparationJson, PlayerPreparationSupport}
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST /player/preparation/birds/:birdType/upgrade — 消耗金币提升鸟等级。 */
final case class UpgradePreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        entry <- PlanSteps.require(
          PlayerPreparationCatalog.find(connection, birdType) match {
            case None    => Left(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
            case Some(e) => Right(e)
          }
        )
        _ <- PlanSteps.read(PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType)))
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        currentLevel <- PlanSteps.read(PlayerPreparationTable.listBirdLevels(connection, userId).getOrElse(birdType, 1))
        _ <- PlanSteps.require(
          if (currentLevel >= PlayerPreparationTable.maxLevel) {
            Left(HttpError.conflict("MAX_LEVEL", "Bird is already at max level"))
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
          PlayerPreparationTable.upgradeBird(connection, userId, birdType) match {
            case Left(message) => Left(HttpError.badRequest("INVALID_BIRD", message))
            case Right(_)      => Right(())
          }
        )
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
