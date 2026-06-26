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

/** POST .../birds/:birdType/upgrade 鸟升级 APIMessage。 */
final case class UpgradePreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 消耗金币升级指定鸟种的等级。
    *
    * 关联的前端 API：POST /player/preparation/birds/:birdType/upgrade；前端 `UpgradePreparationBirdApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- PlanSteps.fromEither(AccessControl.requireRole(connection, userId, UserRole.Player))
        // 步骤 2：从 Catalog 加载鸟种信息
        entry <- requireCatalogEntry(connection)
        // 步骤 3：确保玩家鸟种升级记录存在（初始化默认值）
        _ <- PlanSteps.read(PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType)))
        // 步骤 4：获取或创建玩家钱包
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        // 步骤 5：读取当前鸟种等级
        currentLevel <- PlanSteps.read(PlayerPreparationTable.listBirdLevels(connection, userId).getOrElse(birdType, 1))
        // 步骤 6：确认未达最高等级
        _ <- requireBirdBelowMaxLevel(currentLevel)
        cost = PlayerPreparationTable.upgradeCost(currentLevel)
        // 步骤 7：确认钱包金币足够支付升级费用
        _ <- requireCoins(wallet, cost)
        // 步骤 8：执行鸟种等级 +1
        _ <- requireUpgradeBird(connection)
        updatedWallet = wallet.copy(coins = wallet.coins - cost)
        // 步骤 9：扣减金币并持久化钱包
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        catalog <- requireCatalog(connection)
        skillConfigs <- requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }

  private def requireCatalog(connection: Connection): cats.data.EitherT[IO, HttpError, Vector[BirdCatalogEntry]] =
    for {
      system <- PlanSteps.runApi(ListSystemBirdCatalogEntriesInternalAPIMessage(), connection)
      published <- PlanSteps.runApi(ListPublishedBirdCatalogEntriesInternalAPIMessage(), connection)
    } yield PlayerPreparationCatalog.merge(
      system.map(PreparationCatalogMapping.toSystemSnapshot),
      published.map(PreparationCatalogMapping.toPublishedSnapshot)
    )

  private def requireCatalogEntry(connection: Connection): cats.data.EitherT[IO, HttpError, BirdCatalogEntry] =
    for {
      catalog <- requireCatalog(connection)
      entry <- PlayerPreparationCatalog.find(catalog, birdType) match {
        case None    => PlanSteps.reject(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
        case Some(e) => PlanSteps.accept(e)
      }
    } yield entry

  private def requireSkillConfigMap(connection: Connection): cats.data.EitherT[IO, HttpError, Map[String, BirdSkillConfigView]] =
    PlanSteps
      .runApi(GetBirdSkillConfigMapInternalAPIMessage(), connection)
      .map(_.view.mapValues(PreparationCatalogMapping.toSkillConfigView).toMap)

  private def requireBirdBelowMaxLevel(currentLevel: Int): cats.data.EitherT[IO, HttpError, Unit] =
    if (currentLevel >= PlayerPreparationTable.maxLevel) {
      PlanSteps.reject(HttpError.conflict("MAX_LEVEL", "Bird is already at max level"))
    } else {
      PlanSteps.accept(())
    }

  private def requireCoins(wallet: PlayerWallet, cost: Int): cats.data.EitherT[IO, HttpError, Unit] =
    if (wallet.coins < cost) {
      PlanSteps.reject(HttpError.conflict("INSUFFICIENT_COINS", s"Need $cost coins to upgrade"))
    } else {
      PlanSteps.accept(())
    }

  private def requireUpgradeBird(connection: Connection): cats.data.EitherT[IO, HttpError, Unit] =
    EitherT.liftF(IO(PlayerPreparationTable.upgradeBird(connection, userId, birdType))).flatMap {
      case Left(message) => EitherT.leftT[IO, Unit](HttpError.badRequest("INVALID_BIRD", message))
      case Right(_)      => EitherT.rightT[IO, HttpError](())
    }
}
