package microservice.player.preparation

import cats.data.EitherT
import cats.effect.IO
import java.sql.Connection
import microservice.bird.api.internal.player.{
  GetBirdSkillConfigMapInternalAPIMessage,
  ListPublishedBirdCatalogEntriesInternalAPIMessage,
  ListSystemBirdCatalogEntriesInternalAPIMessage
}
import microservice.infrastructure.api.{PlanStep, PlanSteps}
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.preparation.BirdSkillConfigView
import microservice.player.support.catalog.PreparationCatalogMapping
import microservice.player.objects.PlayerWallet
import microservice.player.tables.preparation.PlayerPreparationTable

/** 备战页升级/升阶与鸟种 catalog 查表的前置校验。 */
private[player] object PlayerPreparationAccess {
  def requireCatalog(connection: Connection): Step[Vector[BirdCatalogEntry]] =
    for {
      system <- PlanSteps.runApi(ListSystemBirdCatalogEntriesInternalAPIMessage(), connection)
      published <- PlanSteps.runApi(ListPublishedBirdCatalogEntriesInternalAPIMessage(), connection)
    } yield PlayerPreparationCatalog.merge(
      system.map(PreparationCatalogMapping.toSystemSnapshot),
      published.map(PreparationCatalogMapping.toPublishedSnapshot)
    )

  def requireSkillConfigMap(connection: Connection): Step[Map[String, BirdSkillConfigView]] =
    PlanSteps
      .runApi(GetBirdSkillConfigMapInternalAPIMessage(), connection)
      .map(_.view.mapValues(PreparationCatalogMapping.toSkillConfigView).toMap)

  def requireCatalogEntry(connection: Connection, birdType: String): Step[BirdCatalogEntry] =
    for {
      catalog <- requireCatalog(connection)
      entry <- PlayerPreparationCatalog.find(catalog, birdType) match {
        case None    => PlanStep.fail(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
        case Some(e) => PlanStep.succeed(e)
      }
    } yield entry

  def requireBirdBelowMaxLevel(currentLevel: Int): Step[Unit] =
    if (currentLevel >= PlayerPreparationTable.maxLevel) {
      PlanStep.fail(HttpError.conflict("MAX_LEVEL", "Bird is already at max level"))
    } else {
      PlanStep.succeed(())
    }

  def requireBirdBelowMaxTier(currentTier: Int): Step[Unit] =
    if (currentTier >= PlayerPreparationTable.maxTier) {
      PlanStep.fail(HttpError.conflict("MAX_TIER", "Bird is already at max tier"))
    } else {
      PlanStep.succeed(())
    }

  def requireSlingshotBelowMaxLevel(currentLevel: Int): Step[Unit] =
    if (currentLevel >= PlayerPreparationTable.maxLevel) {
      PlanStep.fail(HttpError.conflict("MAX_LEVEL", "Slingshot is already at max level"))
    } else {
      PlanStep.succeed(())
    }

  def requireCoins(wallet: PlayerWallet, cost: Int): Step[Unit] =
    if (wallet.coins < cost) {
      PlanStep.fail(HttpError.conflict("INSUFFICIENT_COINS", s"Need $cost coins to upgrade"))
    } else {
      PlanStep.succeed(())
    }

  def requireFragments(wallet: PlayerWallet, cost: Int): Step[Unit] =
    if (wallet.fragments < cost) {
      PlanStep.fail(HttpError.conflict("INSUFFICIENT_FRAGMENTS", s"Need $cost fragments to upgrade"))
    } else {
      PlanStep.succeed(())
    }

  def requireUpgradeBird(connection: Connection, userId: String, birdType: String): Step[Unit] =
    EitherT.liftF(IO(PlayerPreparationTable.upgradeBird(connection, userId, birdType))).flatMap {
      case Left(message) => EitherT.leftT(HttpError.badRequest("INVALID_BIRD", message))
      case Right(_)      => EitherT.rightT(())
    }

  def requireAscendBird(connection: Connection, userId: String, birdType: String): Step[Unit] =
    EitherT.liftF(IO(PlayerPreparationTable.ascendBird(connection, userId, birdType))).flatMap {
      case Left(message) => EitherT.leftT(HttpError.badRequest("INVALID_BIRD", message))
      case Right(_)      => EitherT.rightT(())
    }

  def requireUpgradeSlingshot(connection: Connection, userId: String): Step[Unit] =
    EitherT.liftF(IO(PlayerPreparationTable.upgradeSlingshot(connection, userId))).flatMap {
      case Left(message) => EitherT.leftT(HttpError.badRequest("INVALID_SLINGSHOT", message))
      case Right(_)      => EitherT.rightT(())
    }
}
