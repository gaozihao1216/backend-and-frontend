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

/** POST .../birds/:birdType/ascend 鸟升阶 APIMessage。 */
final case class AscendPreparationBirdAPIMessage(userId: String, birdType: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  /** plan 定义了什么业务流程：Player 消耗碎片升阶指定鸟种。
    *
    * 关联的前端 API：POST /player/preparation/birds/:birdType/ascend；前端 `AscendPreparationBirdApi`。
    */
  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        // 步骤 1：校验调用者为 Player
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        // 步骤 2：从 Catalog 加载鸟种信息
        entry <- requireCatalogEntry(connection)
        // 步骤 3：确保玩家鸟种升阶记录存在（初始化默认值）
        _ <- PlanSteps.read(PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType)))
        // 步骤 4：获取或创建玩家钱包
        wallet <- PlanSteps.read(PlayerWalletTable.getOrCreate(connection, userId))
        // 步骤 5：读取当前鸟种阶位
        currentTier <- PlanSteps.read(PlayerPreparationTable.listBirdTiers(connection, userId).getOrElse(birdType, 1))
        // 步骤 6：确认未达最高阶位
        _ <- requireBirdBelowMaxTier(currentTier)
        cost = PlayerPreparationTable.ascendCost(currentTier)
        // 步骤 7：确认钱包碎片足够支付升阶费用
        _ <- requireFragments(wallet, cost)
        // 步骤 8：执行鸟种阶位 +1
        _ <- requireAscendBird(connection)
        updatedWallet = wallet.copy(fragments = wallet.fragments - cost)
        // 步骤 9：扣减碎片并持久化钱包
        _ <- PlanSteps.read(PlayerWalletTable.save(connection, userId, updatedWallet))
        catalog <- requireCatalog(connection)
        skillConfigs <- requireSkillConfigMap(connection)
        response <- PlanSteps.read(PlayerPreparationSupport.buildResponse(connection, userId, updatedWallet, catalog, skillConfigs))
      } yield PlayerPreparationJson.toJson(response)
    }

  private def requireCatalog(connection: Connection): PlanStep.Step[Vector[BirdCatalogEntry]] =
    for {
      system <- PlanSteps.runApi(ListSystemBirdCatalogEntriesInternalAPIMessage(), connection)
      published <- PlanSteps.runApi(ListPublishedBirdCatalogEntriesInternalAPIMessage(), connection)
    } yield PlayerPreparationCatalog.merge(
      system.map(PreparationCatalogMapping.toSystemSnapshot),
      published.map(PreparationCatalogMapping.toPublishedSnapshot)
    )

  private def requireCatalogEntry(connection: Connection): PlanStep.Step[BirdCatalogEntry] =
    for {
      catalog <- requireCatalog(connection)
      entry <- PlayerPreparationCatalog.find(catalog, birdType) match {
        case None    => PlanStep.fail(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
        case Some(e) => PlanStep.succeed(e)
      }
    } yield entry

  private def requireSkillConfigMap(connection: Connection): PlanStep.Step[Map[String, BirdSkillConfigView]] =
    PlanSteps
      .runApi(GetBirdSkillConfigMapInternalAPIMessage(), connection)
      .map(_.view.mapValues(PreparationCatalogMapping.toSkillConfigView).toMap)

  private def requireBirdBelowMaxTier(currentTier: Int): PlanStep.Step[Unit] =
    if (currentTier >= PlayerPreparationTable.maxTier) {
      PlanStep.fail(HttpError.conflict("MAX_TIER", "Bird is already at max tier"))
    } else {
      PlanStep.succeed(())
    }

  private def requireFragments(wallet: PlayerWallet, cost: Int): PlanStep.Step[Unit] =
    if (wallet.fragments < cost) {
      PlanStep.fail(HttpError.conflict("INSUFFICIENT_FRAGMENTS", s"Need $cost fragments to upgrade"))
    } else {
      PlanStep.succeed(())
    }

  private def requireAscendBird(connection: Connection): PlanStep.Step[Unit] =
    EitherT.liftF(IO(PlayerPreparationTable.ascendBird(connection, userId, birdType))).flatMap {
      case Left(message) => EitherT.leftT[IO, Unit](HttpError.badRequest("INVALID_BIRD", message))
      case Right(_)      => EitherT.rightT[IO, HttpError](())
    }
}
