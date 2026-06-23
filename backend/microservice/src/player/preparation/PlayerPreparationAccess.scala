package microservice.player.preparation

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.player.objects.PlayerWallet
import microservice.player.tables.preparation.PlayerPreparationTable

/** 备战页升级/升阶与鸟种 catalog 查表的前置校验。 */
object PlayerPreparationAccess {
  def requireCatalogEntry(connection: Connection, birdType: String): Step[BirdCatalogEntry] =
    PlanStep.fromEither(checkCatalogEntry(connection, birdType))

  def requireBirdBelowMaxLevel(currentLevel: Int): Step[Unit] =
    PlanStep.fromEither(checkBirdBelowMaxLevel(currentLevel))

  def requireBirdBelowMaxTier(currentTier: Int): Step[Unit] =
    PlanStep.fromEither(checkBirdBelowMaxTier(currentTier))

  def requireSlingshotBelowMaxLevel(currentLevel: Int): Step[Unit] =
    PlanStep.fromEither(checkSlingshotBelowMaxLevel(currentLevel))

  def requireCoins(wallet: PlayerWallet, cost: Int): Step[Unit] =
    PlanStep.fromEither(checkCoins(wallet, cost))

  def requireFragments(wallet: PlayerWallet, cost: Int): Step[Unit] =
    PlanStep.fromEither(checkFragments(wallet, cost))

  def requireUpgradeBird(connection: Connection, userId: String, birdType: String): Step[Unit] =
    PlanStep.fromEither(checkUpgradeBird(connection, userId, birdType))

  def requireAscendBird(connection: Connection, userId: String, birdType: String): Step[Unit] =
    PlanStep.fromEither(checkAscendBird(connection, userId, birdType))

  def requireUpgradeSlingshot(connection: Connection, userId: String): Step[Unit] =
    PlanStep.fromEither(checkUpgradeSlingshot(connection, userId))

  def checkCatalogEntry(connection: Connection, birdType: String): Either[HttpError, BirdCatalogEntry] =
    PlayerPreparationCatalog.find(connection, birdType) match {
      case None    => Left(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
      case Some(e) => Right(e)
    }

  def checkBirdBelowMaxLevel(currentLevel: Int): Either[HttpError, Unit] =
    if (currentLevel >= PlayerPreparationTable.maxLevel) {
      Left(HttpError.conflict("MAX_LEVEL", "Bird is already at max level"))
    } else {
      Right(())
    }

  def checkBirdBelowMaxTier(currentTier: Int): Either[HttpError, Unit] =
    if (currentTier >= PlayerPreparationTable.maxTier) {
      Left(HttpError.conflict("MAX_TIER", "Bird is already at max tier"))
    } else {
      Right(())
    }

  def checkSlingshotBelowMaxLevel(currentLevel: Int): Either[HttpError, Unit] =
    if (currentLevel >= PlayerPreparationTable.maxLevel) {
      Left(HttpError.conflict("MAX_LEVEL", "Slingshot is already at max level"))
    } else {
      Right(())
    }

  def checkCoins(wallet: PlayerWallet, cost: Int): Either[HttpError, Unit] =
    if (wallet.coins < cost) {
      Left(HttpError.conflict("INSUFFICIENT_COINS", s"Need $cost coins to upgrade"))
    } else {
      Right(())
    }

  def checkFragments(wallet: PlayerWallet, cost: Int): Either[HttpError, Unit] =
    if (wallet.fragments < cost) {
      Left(HttpError.conflict("INSUFFICIENT_FRAGMENTS", s"Need $cost fragments to upgrade"))
    } else {
      Right(())
    }

  def checkUpgradeBird(connection: Connection, userId: String, birdType: String): Either[HttpError, Unit] =
    PlayerPreparationTable.upgradeBird(connection, userId, birdType) match {
      case Left(message) => Left(HttpError.badRequest("INVALID_BIRD", message))
      case Right(_)      => Right(())
    }

  def checkAscendBird(connection: Connection, userId: String, birdType: String): Either[HttpError, Unit] =
    PlayerPreparationTable.ascendBird(connection, userId, birdType) match {
      case Left(message) => Left(HttpError.badRequest("INVALID_BIRD", message))
      case Right(_)      => Right(())
    }

  def checkUpgradeSlingshot(connection: Connection, userId: String): Either[HttpError, Unit] =
    PlayerPreparationTable.upgradeSlingshot(connection, userId) match {
      case Left(message) => Left(HttpError.badRequest("INVALID_SLINGSHOT", message))
      case Right(_)      => Right(())
    }
}
