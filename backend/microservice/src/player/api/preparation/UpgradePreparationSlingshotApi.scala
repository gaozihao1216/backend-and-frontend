package microservice.player.api.preparation

import cats.data.EitherT
import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import microservice.bird.api.internal.player.{
  GetBirdSkillConfigMapInternalAPIMessage,
  ListPublishedBirdCatalogEntriesInternalAPIMessage,
  ListSystemBirdCatalogEntriesInternalAPIMessage
}
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.player.objects.preparation.{BirdSkillConfigView, PlayerPreparationJson}
import microservice.player.objects.wallet.PlayerWallet
import microservice.player.support.catalog.PreparationCatalogMapping
import microservice.player.support.preparation.{BirdCatalogEntry, PlayerPreparationCatalog, PlayerPreparationSupport}
import microservice.player.tables.preparation.PlayerPreparationTable
import microservice.player.tables.wallet.PlayerWalletTable
import microservice.system.objects.enums.UserRole
import microservice.user.support.AccessControl

/** POST .../slingshot/upgrade 弹弓升级 APIMessage。 */
final case class UpgradePreparationSlingshotAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 消耗金币升级弹弓等级。
    *
    * 关联的前端 API：POST /player/preparation/slingshot/upgrade；前端 `UpgradePreparationSlingshotApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：获取或创建玩家钱包
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        // 步骤 3：读取当前弹弓等级
        currentLevel <- PlanSteps.read(PlayerPreparationTable.getSlingshotLevel(connection, userId))
        // 步骤 4：确认未达最高等级
        _ <- requireSlingshotBelowMaxLevel(currentLevel)
        cost = PlayerPreparationTable.upgradeCost(currentLevel)
        // 步骤 5：确认钱包金币足够支付升级费用
        _ <- requireCoins(wallet, cost)
        // 步骤 6：执行弹弓等级 +1
        _ <- requireUpgradeSlingshot(connection)
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        // 步骤 7：扣减金币并持久化钱包
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        catalog <- requireCatalog(connection)
        skillConfigs <- requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }

  private def requireSlingshotBelowMaxLevel(currentLevel: Int): PlanStep.Step[Unit] =
    if (currentLevel >= PlayerPreparationTable.maxLevel) {
      PlanStep.fail(HttpError.conflict("MAX_LEVEL", "Slingshot is already at max level"))
    } else {
      PlanStep.succeed(())
    }

  private def requireCoins(wallet: PlayerWallet, cost: Int): PlanStep.Step[Unit] =
    if (wallet.coins < cost) {
      PlanStep.fail(HttpError.conflict("INSUFFICIENT_COINS", s"Need $cost coins to upgrade"))
    } else {
      PlanStep.succeed(())
    }

  private def requireUpgradeSlingshot(connection: Connection): PlanStep.Step[Unit] =
    EitherT.liftF(IO(PlayerPreparationTable.upgradeSlingshot(connection, userId))).flatMap {
      case Left(message) => EitherT.leftT[IO, Unit](HttpError.badRequest("INVALID_SLINGSHOT", message))
      case Right(_)      => EitherT.rightT[IO, HttpError](())
    }

  private def requireCatalog(connection: Connection): PlanStep.Step[Vector[BirdCatalogEntry]] =
    for {
      system <- PlanSteps.runApi(ListSystemBirdCatalogEntriesInternalAPIMessage(), connection)
      published <- PlanSteps.runApi(ListPublishedBirdCatalogEntriesInternalAPIMessage(), connection)
    } yield PlayerPreparationCatalog.merge(
      system.map(PreparationCatalogMapping.toSystemSnapshot),
      published.map(PreparationCatalogMapping.toPublishedSnapshot)
    )

  private def requireSkillConfigMap(connection: Connection): PlanStep.Step[Map[String, BirdSkillConfigView]] =
    PlanSteps
      .runApi(GetBirdSkillConfigMapInternalAPIMessage(), connection)
      .map(_.view.mapValues(PreparationCatalogMapping.toSkillConfigView).toMap)
}
