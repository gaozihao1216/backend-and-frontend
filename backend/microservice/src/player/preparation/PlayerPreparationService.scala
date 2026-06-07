package microservice.player.preparation

import microservice.infrastructure.http.HttpError
import microservice.player.runtime.PlayerWallet
import microservice.player.tables.{PlayerPreparationTable, PlayerWalletTable}
import microservice.bird.tables.BirdSkillConfigTable
import io.circe.Json
import io.circe.syntax._
import java.sql.Connection

object PlayerPreparationService {
  def getState(connection: Connection, userId: String): Either[HttpError, PlayerPreparationResponse] = {
    val wallet = PlayerWalletTable.getOrCreate(connection, userId)
    Right(buildResponse(connection, userId, wallet))
  }

  def upgradeBird(connection: Connection, userId: String, birdType: String): Either[HttpError, PlayerPreparationResponse] = {
    PlayerPreparationCatalog.find(connection, birdType) match {
      case None => Left(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
      case Some(entry) =>
        PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType))
        val wallet = PlayerWalletTable.getOrCreate(connection, userId)
        val currentLevel = PlayerPreparationTable.listBirdLevels(connection, userId).getOrElse(birdType, 1)
        if (currentLevel >= PlayerPreparationTable.maxLevel) {
          return Left(HttpError.conflict("MAX_LEVEL", "Bird is already at max level"))
        }
        val cost = PlayerPreparationTable.upgradeCost(currentLevel)
        if (wallet.coins < cost) {
          return Left(HttpError.conflict("INSUFFICIENT_COINS", s"Need $cost coins to upgrade"))
        }

        PlayerPreparationTable.upgradeBird(connection, userId, birdType) match {
          case Left(message) => Left(HttpError.badRequest("INVALID_BIRD", message))
          case Right(_) =>
            PlayerWalletTable.save(connection, userId, wallet.copy(coins = wallet.coins - cost))
            getState(connection, userId)
        }
    }
  }

  def ascendBird(connection: Connection, userId: String, birdType: String): Either[HttpError, PlayerPreparationResponse] = {
    PlayerPreparationCatalog.find(connection, birdType) match {
      case None => Left(HttpError.notFound("UNKNOWN_BIRD", s"Unknown bird type: $birdType"))
      case Some(entry) =>
        PlayerPreparationTable.ensureBirdDefaults(connection, userId, Vector(entry.birdType))
        val wallet = PlayerWalletTable.getOrCreate(connection, userId)
        val currentTier = PlayerPreparationTable.listBirdTiers(connection, userId).getOrElse(birdType, 1)
        if (currentTier >= PlayerPreparationTable.maxTier) {
          return Left(HttpError.conflict("MAX_TIER", "Bird is already at max tier"))
        }
        val cost = PlayerPreparationTable.ascendCost(currentTier)
        if (wallet.fragments < cost) {
          return Left(HttpError.conflict("INSUFFICIENT_FRAGMENTS", s"Need $cost fragments to upgrade"))
        }

        PlayerPreparationTable.ascendBird(connection, userId, birdType) match {
          case Left(message) => Left(HttpError.badRequest("INVALID_BIRD", message))
          case Right(_) =>
            PlayerWalletTable.save(connection, userId, wallet.copy(fragments = wallet.fragments - cost))
            getState(connection, userId)
        }
    }
  }

  def upgradeSlingshot(connection: Connection, userId: String): Either[HttpError, PlayerPreparationResponse] = {
    val wallet = PlayerWalletTable.getOrCreate(connection, userId)
    val currentLevel = PlayerPreparationTable.getSlingshotLevel(connection, userId)
    if (currentLevel >= PlayerPreparationTable.maxLevel) {
      return Left(HttpError.conflict("MAX_LEVEL", "Slingshot is already at max level"))
    }
    val cost = PlayerPreparationTable.upgradeCost(currentLevel)
    if (wallet.coins < cost) {
      return Left(HttpError.conflict("INSUFFICIENT_COINS", s"Need $cost coins to upgrade"))
    }

    PlayerPreparationTable.upgradeSlingshot(connection, userId) match {
      case Left(message) => Left(HttpError.badRequest("INVALID_SLINGSHOT", message))
      case Right(_) =>
        PlayerWalletTable.save(connection, userId, wallet.copy(coins = wallet.coins - cost))
        getState(connection, userId)
    }
  }

  def toJson(response: PlayerPreparationResponse): Json =
    Json.obj(
      "birds" -> Json.arr(response.birds.map(birdToJson): _*),
      "slingshot" -> Json.obj(
        "level" -> Json.fromInt(response.slingshot.level),
        "maxLevel" -> Json.fromInt(response.slingshot.maxLevel),
        "nextCostCoins" -> Json.fromInt(response.slingshot.nextCostCoins)
      ),
      "walletCoins" -> Json.fromInt(response.walletCoins),
      "walletFragments" -> Json.fromInt(response.walletFragments)
    )

  private def birdToJson(bird: BirdUpgradeView): Json =
    Json.obj(
      "birdType" -> Json.fromString(bird.birdType),
      "name" -> Json.fromString(bird.name),
      "summary" -> Json.fromString(bird.summary),
      "previewImageUrl" -> Json.fromString(bird.previewImageUrl),
      "level" -> Json.fromInt(bird.level),
      "maxLevel" -> Json.fromInt(bird.maxLevel),
      "tier" -> Json.fromInt(bird.tier),
      "maxTier" -> Json.fromInt(bird.maxTier),
      "stats" -> Json.obj(
        "attack" -> Json.fromInt(bird.stats.attack),
        "impact" -> Json.fromInt(bird.stats.impact),
        "speed" -> Json.fromInt(bird.stats.speed)
      ),
      "skillName" -> Json.fromString(bird.skillName),
      "skillDescription" -> Json.fromString(bird.skillDescription),
      "nextTierSkillPreview" -> bird.nextTierSkillPreview.fold(Json.Null)(Json.fromString),
      "nextCostCoins" -> Json.fromInt(bird.nextCostCoins),
      "nextCostFragments" -> Json.fromInt(bird.nextCostFragments),
      "source" -> Json.fromString(bird.source),
      "authorId" -> bird.authorId.fold(Json.Null)(Json.fromString),
      "skills" -> bird.skills.fold(Json.Null)(identity),
      "modelImageUrl" -> bird.modelImageUrl.fold(Json.Null)(Json.fromString)
    )

  private def buildResponse(connection: Connection, userId: String, wallet: PlayerWallet): PlayerPreparationResponse = {
    val catalogEntries = PlayerPreparationCatalog.loadEntries(connection)
    PlayerPreparationTable.ensureBirdDefaults(connection, userId, catalogEntries.map(_.birdType))
    val birdLevels = PlayerPreparationTable.listBirdLevels(connection, userId)
    val birdTiers = PlayerPreparationTable.listBirdTiers(connection, userId)
    val slingshotLevel = PlayerPreparationTable.getSlingshotLevel(connection, userId)
    val skillConfigs = BirdSkillConfigTable.skillsJsonMap(connection)
    PlayerPreparationResponse(
      birds = catalogEntries.map { entry =>
        val level = birdLevels.getOrElse(entry.birdType, 1)
        val tier = birdTiers.getOrElse(entry.birdType, 1)
        val stats = BirdPreparationCatalog.statsFor(level, entry.baseStats)
        val skillConfig = skillConfigs.get(entry.birdType)
        BirdUpgradeView(
          birdType = entry.birdType,
          name = entry.name,
          summary = entry.summary,
          previewImageUrl = entry.previewImageUrl,
          level = level,
          maxLevel = PlayerPreparationTable.maxLevel,
          tier = tier,
          maxTier = PlayerPreparationTable.maxTier,
          stats = BirdStatsView(stats.attack, stats.impact, stats.speed),
          skillName = entry.skillName,
          skillDescription = BirdPreparationCatalog.skillDescription(entry, tier),
          nextTierSkillPreview = BirdPreparationCatalog.nextTierSkillPreview(entry, tier),
          nextCostCoins = if (level >= PlayerPreparationTable.maxLevel) 0 else PlayerPreparationTable.upgradeCost(level),
          nextCostFragments = if (tier >= PlayerPreparationTable.maxTier) 0 else PlayerPreparationTable.ascendCost(tier),
          source = entry.source,
          authorId = entry.authorId,
          skills = skillConfig.map(_.skills),
          modelImageUrl = skillConfig.flatMap(_.modelImageUrl).orElse(Some(entry.previewImageUrl))
        )
      }.toList,
      slingshot = SlingshotUpgradeView(
        level = slingshotLevel,
        maxLevel = PlayerPreparationTable.maxLevel,
        nextCostCoins =
          if (slingshotLevel >= PlayerPreparationTable.maxLevel) 0
          else PlayerPreparationTable.upgradeCost(slingshotLevel)
      ),
      walletCoins = wallet.coins,
      walletFragments = wallet.fragments
    )
  }
}
