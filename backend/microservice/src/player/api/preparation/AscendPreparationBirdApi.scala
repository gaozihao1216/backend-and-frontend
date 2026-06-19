package microservice.player.api.preparation

import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.preparation.{PlayerPreparationCatalog, PlayerPreparationSupport}
import microservice.player.objects.PlayerPreparationJson
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.UserRole
import microservice.user.utils.AccessControl

/** POST .../birds/:birdType/ascend 鸟升阶 APIMessage。
  *
  * 定义：满级后升阶，解锁下一 tier 技能描述。
  * 问题：升阶与升级是不同阶段，需独立校验 maxTier。
  * 作用：校验 tier 上限 → 扣费 → ascendBird。
  * 关联：[[BirdPreparationCatalog.maxTier]]；[[PlayerPreparationTable]]。
  */
final case class AscendPreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
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
        currentTier <- PlanSteps.read(PlayerPreparationTable.listBirdTiers(connection, userId).getOrElse(birdType, 1))
        _ <- PlanSteps.require(
          if (currentTier >= PlayerPreparationTable.maxTier) {
            Left(HttpError.conflict("MAX_TIER", "Bird is already at max tier"))
          } else {
            Right(())
          }
        )
        cost = PlayerPreparationTable.ascendCost(currentTier)
        _ <- PlanSteps.require(
          if (wallet.fragments < cost) {
            Left(HttpError.conflict("INSUFFICIENT_FRAGMENTS", s"Need $cost fragments to upgrade"))
          } else {
            Right(())
          }
        )
        _ <- PlanSteps.require(
          PlayerPreparationTable.ascendBird(connection, userId, birdType) match {
            case Left(message) => Left(HttpError.badRequest("INVALID_BIRD", message))
            case Right(_)      => Right(())
          }
        )
        updatedWallet = wallet.copy(fragments = wallet.fragments - cost)
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet))
      } yield PlayerPreparationJson.toJson(response)
    }
}
